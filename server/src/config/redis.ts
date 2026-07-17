import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

const redisUrl   = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("⚠️  REDIS_URL or REDIS_TOKEN not set — Upstash REST cache disabled");
}

// ── Upstash REST client (cache / general key-value, NOT BullMQ) ────────────
const client = new Redis({
  url:   redisUrl   || "",
  token: redisToken || "",
});

interface RedisClient extends Redis {
  isConnected: boolean;
}

export const redis: RedisClient = Object.assign(client, { isConnected: false });

(async () => {
  try {
    await client.set("__health_check__", "ok");
    const result = await client.get("__health_check__");
    if (result === "ok") {
      redis.isConnected = true;
      console.log("✅ Redis connected (Upstash REST — cache only, no BullMQ)");
      await client.del("__health_check__");
    }
  } catch (error) {
    console.error("Redis health-check failed:", error);
  }
})();

// ── ioredis TCP client (BullMQ queues / workers) ───────────────────────────
// Requires a Redis TCP endpoint — set REDIS_TCP_URL in your .env.
// Upstash: Dashboard → REST API → ioredis connection string (rediss://...)
export const bullRedis: IORedis | null = process.env.REDIS_TCP_URL
  ? (() => {
      const conn = new IORedis(process.env.REDIS_TCP_URL as string, {
        maxRetriesPerRequest: null,  // required by BullMQ
        enableReadyCheck:     false, // required by BullMQ
        tls: (process.env.REDIS_TCP_URL as string).startsWith("rediss://")
          ? { rejectUnauthorized: false }
          : undefined,
        // Limit retries on initial connect so a bad URL fails loudly
        // instead of retrying indefinitely in the background.
        retryStrategy: (times) => {
          if (times > 5) {
            console.error(
              `[ioredis] ${times} failed connect attempts — ` +
              "check REDIS_TCP_URL. Giving up."
            );
            return null; // stop retrying
          }
          return Math.min(times * 500, 3000);
        },
      });

      conn.on("connect", () => console.log("✅ ioredis (BullMQ) connected"));
      conn.on("ready",   () => console.log("✅ ioredis (BullMQ) ready"));
      conn.on("close",   () => console.warn("⚠️  ioredis (BullMQ) connection closed"));
      conn.on("error",   (err: Error) =>
        console.error(`[ioredis] error: ${err.message}`)
      );

      // Safety net: if ioredis hasn't emitted 'ready' within 10 s the URL
      // is likely wrong. Destroy the client so BullMQ doesn't queue jobs
      // against a permanently-broken connection.
      const readyTimeout = setTimeout(() => {
        if (conn.status !== "ready") {
          console.error(
            "[ioredis] Did not become ready within 10 s — destroying client. " +
            "Verify REDIS_TCP_URL is correct."
          );
          conn.disconnect();
        }
      }, 10_000);

      // Unref so the timeout doesn't keep the Node process alive on clean exit
      readyTimeout.unref();

      return conn;
    })()
  : null;

if (!bullRedis) {
  console.warn(
    "⚠️  REDIS_TCP_URL not set — BullMQ queues/workers disabled. " +
    "SLA enforcement and background jobs will not run."
  );
}
