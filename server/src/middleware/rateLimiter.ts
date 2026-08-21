import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const memoryStore: RateLimitStore = {};

export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100;
  const message = options.message || "Too many requests, please try again later.";

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || "global";
    const now = Date.now();

    if (!memoryStore[ip] || now > memoryStore[ip].resetTime) {
      memoryStore[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    memoryStore[ip].count += 1;

    if (memoryStore[ip].count > max) {
      res.status(429).json({ error: message, message });
      return;
    }

    next();
  };
}

export const generalLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200 });
export const submitLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 20, message: "Submission rate limit exceeded. Please wait a minute." });

export default { createRateLimiter, generalLimiter, submitLimiter };
