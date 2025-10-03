// src/lib/redis.ts
import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export function redis(): RedisClientType {
  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", (err: unknown) => {
      console.error("[redis] error:", err);
    });
    client.connect().catch((e: unknown) => {
      console.error("[redis] connect fail:", e);
    });
  }
  return client;
}
