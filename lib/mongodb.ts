import { MongoClient } from "mongodb";

type MongoCache = {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
};

const globalCache = globalThis as typeof globalThis & { __mongoCache?: MongoCache };

if (!globalCache.__mongoCache) {
  globalCache.__mongoCache = { client: null, promise: null };
}

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  const cache = globalCache.__mongoCache!;
  if (cache.client) return cache.client;

  if (!cache.promise) {
    cache.promise = new MongoClient(uri).connect();
  }

  cache.client = await cache.promise;
  return cache.client;
}
