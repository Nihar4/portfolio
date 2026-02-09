import { getMongoClient } from "./mongodb";

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
    lastSeen?: string;
  };
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
        "meta.lastSeen": time,
      },
      $push: { events: { ...event, time } },
      $setOnInsert: { visitorId: key },
    },
    { upsert: true },
  );
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
      events: doc.events,
    };
  }
  return store;
};
