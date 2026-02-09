import clientPromise from "./mongodb";

export type LogEvent = {
  type: "api" | "chat" | "client";
  endpoint?: string;
  method?: string;
  time: string;
  message?: string;
  data?: Record<string, unknown>;
};

export type LogEntry = {
  ip: string;
  meta: {
    userAgent?: string;
    deviceType?: string;
    location?: Record<string, string | undefined>;
    lastSeen?: string;
  };
  events: LogEvent[];
};

export type LogStore = Record<string, LogEntry>;

const DB_NAME = "portfolio";
const COLLECTION = "logs";

const getCollection = async () => {
  const client = await clientPromise;
  return client.db(DB_NAME).collection<LogEntry>(COLLECTION);
};

const deviceTypeFromUA = (ua?: string | null) => {
  if (!ua) return "unknown";
  const lower = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)/.test(lower)) return "tablet";
  if (/(mobi|iphone|android|blackberry|phone)/.test(lower)) return "mobile";
  return "desktop";
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

export const appendLog = async (headers: Headers, event: LogEvent) => {
  const ip = extractIp(headers);
  const ua = headers.get("user-agent");
  const deviceType = deviceTypeFromUA(ua);
  const location = extractLocation(headers);
  const time = event.time || new Date().toISOString();

  const col = await getCollection();

  await col.updateOne(
    { ip },
    {
      $set: {
        "meta.userAgent": ua || undefined,
        "meta.deviceType": deviceType || undefined,
        "meta.location": location || undefined,
        "meta.lastSeen": time,
      },
      $push: { events: { ...event, time } },
      $setOnInsert: { ip },
    },
    { upsert: true }
  );
};

export const loadLogs = async (): Promise<LogStore> => {
  const col = await getCollection();
  const docs = await col.find({}).toArray();

  const store: LogStore = {};
  for (const doc of docs) {
    store[doc.ip] = {
      ip: doc.ip,
      meta: doc.meta,
      events: doc.events,
    };
  }
  return store;
};
