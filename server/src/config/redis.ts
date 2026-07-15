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
      console.log("Redis connected (Upstash REST — cache only, no BullMQ)");
      await client.del("__health_check__");
    }
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
})();