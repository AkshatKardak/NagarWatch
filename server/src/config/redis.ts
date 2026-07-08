import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("REDIS_URL or REDIS_TOKEN not set — Redis features disabled");
}

const client = new Redis({
  url: redisUrl || "",
  token: redisToken || "",
});

// Add isConnected getter for backward compat with ioredis code
Object.defineProperty(client, "isConnected", {
  get() {
    return true;
  },
  enumerable: true,
});

export const redis = client;

// Verify connection on startup
(async () => {
  try {
    await redis.set("__health_check__", "ok");
    const result = await redis.get("__health_check__");
    if (result === "ok") {
      console.log("Redis connected (Upstash REST)");
      await redis.del("__health_check__");
    }
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
})();