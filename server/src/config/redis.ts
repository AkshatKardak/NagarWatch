import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("REDIS_URL or REDIS_TOKEN not set — Redis features disabled");
}

// ── Upstash REST client (for cache / general key-value usage) ──────────────
const client = new Redis({
  url: redisUrl || "",
  token: redisToken || "",
});

interface RedisClient extends Redis {
  isConnected: boolean;
}

export const redis: RedisClient = Object.assign(client, {
  isConnected: false,
});

(async () => {
  try {
    await client.set("__health_check__", "ok");
    const result = await client.get("__health_check__");
    if (result === "ok") {
      redis.isConnected = true;
      console.log("Redis connected (Upstash REST — cache only, no BullMQ)");
      await client.del("__health_check__");
    }
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
})();

// ── ioredis TCP client (for BullMQ queues/workers) ─────────────────────────
// Requires a Redis TCP endpoint — set REDIS_TCP_URL in your .env
// e.g. redis://default:<password>@<host>:<port>
// Upstash provides this under: Dashboard → REST API → ioredis connection string
export const bullRedis: IORedis | null = process.env.REDIS_TCP_URL
  ? new IORedis(process.env.REDIS_TCP_URL, {
      maxRetriesPerRequest: null,   // required by BullMQ
      enableReadyCheck: false,      // required by BullMQ
      tls: process.env.REDIS_TCP_URL.startsWith("rediss://")
        ? { rejectUnauthorized: false }
        : undefined,
    })
  : null;

if (!bullRedis) {
  console.warn("REDIS_TCP_URL not set — BullMQ queues/workers disabled");
} else {
  bullRedis.on("connect", () => console.log("ioredis (BullMQ) connected"));
  bullRedis.on("error", (err) => console.error("ioredis error:", err.message));
}