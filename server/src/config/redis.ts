import Redis from "ioredis";
import type { Redis as RedisClient } from "ioredis";

export type RedisInstance =
  | (RedisClient & { isConnected: true })
  | { isConnected: false };

let redisClient: RedisInstance;

if (!process.env.REDIS_URL) {
  console.warn("Redis not configured - BullMQ SLA jobs disabled");
  redisClient = { isConnected: false };
} else {
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }) as RedisClient & { isConnected: true };

  client.isConnected = true;
  client.on("connect", () => console.log("Redis connected"));
  client.on("error", (error: Error) => console.error("Redis error", error.message));
  redisClient = client;
}

export default redisClient;
