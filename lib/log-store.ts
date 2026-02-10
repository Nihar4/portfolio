import { getMongoClient } from "./mongodb";
import { fetchIpLocation, type IpLocationResult, type ProviderResult } from "./ip-location";

export type LogEvent = {
  type: "api" | "chat" | "client";
  endpoint?: string;
  method?: string;
  time: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type LogEntry = {
  visitorId: string;
  ip: string;
  meta: {
    userAgent?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    location?: Record<string, string | undefined>;
    gcpLatLon?: string;
    lastSeen?: string;
  };
  geoLocation?: IpLocationResult | null;
  events: LogEvent[];
};

export type LogStore = Record<string, LogEntry>;

const DB_NAME = process.env.MONGODB_DB || "portfolio";
const COLLECTION = process.env.MONGODB_COLLECTION || "logs";

const getCollection = async () => {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(DB_NAME).collection<LogEntry>(COLLECTION);
};

export { getCollection };

const deviceTypeFromUA = (ua?: string | null) => {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)/.test(lower)) return "tablet";
  if (/(mobi|iphone|android|blackberry|phone)/.test(lower)) return "mobile";
  return "desktop";
};

const parseBrowser = (ua?: string | null) => {
  if (!ua) return "unknown";
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua) || /opera/i.test(ua)) return "Opera";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Other";
};

const parseOS = (ua?: string | null) => {
  if (!ua) return "unknown";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
};

const extractIp = (headers: Headers) => {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
};

const extractLocation = (headers: Headers) => ({
  country:
    headers.get("x-vercel-ip-country") ||
    headers.get("x-country") ||
    headers.get("cf-ipcountry") ||
    undefined,
  region:
    headers.get("x-vercel-ip-region") ||
    headers.get("x-region") ||
    undefined,
  city:
    headers.get("x-vercel-ip-city") ||
    headers.get("x-city") ||
    undefined,
});

/** Extract GCP Load Balancer client lat/lon header (injected via custom request header) */
const extractGcpLatLon = (headers: Headers): string | undefined => {
  const val = headers.get("x-client-latlon");
  if (!val || val === "0.0,0.0") return undefined;
  return val;
};

/** Extract visitor_id cookie value from request headers */
export const getVisitorId = (headers: Headers): string | null => {
  const cookie = headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)visitor_id=([^;]+)/);
  return match ? match[1] : null;
};

/** Generate a random UUID v4 */
export const generateVisitorId = (): string => {
  return crypto.randomUUID();
};

export const appendLog = async (
  headers: Headers,
  event: LogEvent,
  visitorId?: string,
) => {
  const ip = extractIp(headers);
  const ua = headers.get("user-agent");
  const deviceType = deviceTypeFromUA(ua);
  const browser = parseBrowser(ua);
  const os = parseOS(ua);
  const location = extractLocation(headers);
  const gcpLatLon = extractGcpLatLon(headers);
  const time = event.time || new Date().toISOString();

  // Use visitorId if available, otherwise fall back to IP
  const key = visitorId || ip;

  const col = await getCollection();
  if (!col) return;

  await col.updateOne(
    { visitorId: key },
    {
      $set: {
        ip,
        "meta.userAgent": ua || undefined,
        "meta.deviceType": deviceType || undefined,
        "meta.browser": browser || undefined,
        "meta.os": os || undefined,
        "meta.location": location || undefined,
        ...(gcpLatLon ? { "meta.gcpLatLon": gcpLatLon } : {}),
        "meta.lastSeen": time,
      },
      $push: { events: { ...event, time } },
      $setOnInsert: { visitorId: key },
    },
    { upsert: true },
  );

  // Fetch geolocation if not already stored (awaited so Cloud Run doesn't kill it)
  await fetchAndStoreGeo(ip, key);
};

/** Fetch geo data for an IP and save to the visitor's document (only if missing) */
const fetchAndStoreGeo = async (ip: string, visitorKey: string) => {
  try {
    const col = await getCollection();
    if (!col) return;

    // Only fetch if geoLocation is not already set
    const existing = await col.findOne({ visitorId: visitorKey, geoLocation: { $exists: true, $ne: null } });
    if (existing) return;

    const geo = await fetchIpLocation(ip);
    if (!geo) return;

    await col.updateOne(
      { visitorId: visitorKey },
      { $set: { geoLocation: geo } },
    );
  } catch {
    /* silent — never crash the visitor's request */
  }
};

/** Force re-fetch geo for a single visitor (always overwrites). Returns the new result. */
export const refetchGeoForVisitor = async (
  ip: string,
  visitorKey: string,
): Promise<IpLocationResult | null> => {
  try {
    const col = await getCollection();
    if (!col) return null;

    const geo = await fetchIpLocation(ip);
    if (!geo) return null;

    await col.updateOne(
      { visitorId: visitorKey },
      { $set: { geoLocation: geo } },
    );
    return geo;
  } catch {
    return null;
  }
};

/** Force re-fetch geo for ALL visitors in the DB. Returns count of updated docs. */
export const refetchGeoForAll = async (): Promise<{ updated: number; failed: number }> => {
  try {
    const col = await getCollection();
    if (!col) return { updated: 0, failed: 0 };

    const docs = await col.find({}).toArray();
    let updated = 0;
    let failed = 0;

    for (const doc of docs) {
      if (!doc.ip || doc.ip === "unknown" || doc.ip === "::1" || doc.ip === "127.0.0.1") {
        failed++;
        continue;
      }
      try {
        const geo = await fetchIpLocation(doc.ip);
        if (geo) {
          await col.updateOne(
            { visitorId: doc.visitorId },
            { $set: { geoLocation: geo } },
          );
          updated++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    return { updated, failed };
  } catch {
    return { updated: 0, failed: 0 };
  }
};

export const loadLogs = async (): Promise<LogStore> => {
  const col = await getCollection();
  if (!col) return {};
  const docs = await col.find({}).toArray();

  const store: LogStore = {};
  for (const doc of docs) {
    const key = doc.visitorId || doc.ip;
    store[key] = {
      visitorId: doc.visitorId || doc.ip,
      ip: doc.ip,
      meta: doc.meta,
      geoLocation: doc.geoLocation || null,
      events: doc.events,
    };
  }
  return store;
};

export const deleteVisitorLog = async (visitorId: string): Promise<boolean> => {
  const col = await getCollection();
  if (!col) return false;
  const result = await col.deleteOne({ visitorId });
  return result.deletedCount > 0;
};

export const deleteAllLogs = async (): Promise<number> => {
  const col = await getCollection();
  if (!col) return 0;
  const result = await col.deleteMany({});
  return result.deletedCount;
};
