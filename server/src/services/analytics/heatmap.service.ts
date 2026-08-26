import { Types } from "mongoose";
import Complaint from "../../models/Complaint";
import { redis } from "../../config/redis";

export interface HeatmapFilter {
  ward?: string;
  category?: string;
  status?: string;
  priority?: string;
  from?: string | Date;
  to?: string | Date;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  category?: string;
  title?: string;
  address?: string;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
  totalComplaints: number;
  maxWeight: number;
}

// In-memory fallback cache if Redis is unconfigured or unavailable
const memoryCache = new Map<string, { exp: number; data: HeatmapResponse }>();

export async function getHeatmapAnalytics(filters: HeatmapFilter): Promise<HeatmapResponse> {
  const cacheKey = `analytics:heatmap:${JSON.stringify(filters)}`;

  // 1. Try Redis cache
  try {
    if (redis && redis.isConnected) {
      const cached = await redis.get<HeatmapResponse>(cacheKey);
      if (cached) return cached;
    } else {
      const mem = memoryCache.get(cacheKey);
      if (mem && mem.exp > Date.now()) return mem.data;
    }
  } catch {
    // proceed to DB query
  }

  // 2. Build MongoDB query match
  const match: any = {};

  if (filters.ward && filters.ward !== "all" && Types.ObjectId.isValid(filters.ward)) {
    match.ward = new Types.ObjectId(filters.ward);
  }

  if (filters.category && filters.category !== "all") {
    match.category = filters.category.toLowerCase();
  }

  if (filters.status && filters.status !== "all") {
    const st = filters.status.toLowerCase().replace(/-/g, "_");
    match.status = st;
  }

  if (filters.priority && filters.priority !== "all") {
    match.priority = filters.priority.toLowerCase();
  }

  if (filters.from || filters.to) {
    match.createdAt = {};
    if (filters.from) match.createdAt.$gte = new Date(filters.from);
    if (filters.to) match.createdAt.$lte = new Date(filters.to);
  }

  // 3. Execute geospatial aggregation query on coordinates
  const aggregationResult = await Complaint.aggregate([
    { $match: match },
    {
      $project: {
        coordinates: "$location.coordinates",
        address: "$location.address",
        category: "$category",
        title: "$title",
        priorityScore: "$priorityScore",
        upvoteCount: "$upvoteCount",
        status: "$status",
      },
    },
  ]);

  let maxWeight = 1;
  const points: HeatmapPoint[] = [];

  for (const doc of aggregationResult) {
    if (
      doc.coordinates &&
      Array.isArray(doc.coordinates) &&
      doc.coordinates.length >= 2 &&
      typeof doc.coordinates[0] === "number" &&
      typeof doc.coordinates[1] === "number"
    ) {
      // MongoDB GeoJSON coordinates are [lng, lat]
      const lng = doc.coordinates[0];
      const lat = doc.coordinates[1];

      // Calculate weight based on priority score and upvotes (scaled 1-10)
      const baseWeight = Math.min(
        10,
        Math.max(1, Math.round((doc.priorityScore || 10) / 10) + Math.min(5, doc.upvoteCount || 0))
      );

      if (baseWeight > maxWeight) {
        maxWeight = baseWeight;
      }

      points.push({
        lat,
        lng,
        weight: baseWeight,
        category: doc.category,
        title: doc.title,
        address: doc.address,
      });
    }
  }

  const result: HeatmapResponse = {
    points,
    totalComplaints: points.length,
    maxWeight,
  };

  // 4. Set cache with 300s TTL (5 minutes)
  try {
    if (redis && redis.isConnected) {
      await redis.set(cacheKey, result, { ex: 300 });
    } else {
      memoryCache.set(cacheKey, { exp: Date.now() + 300_000, data: result });
    }
  } catch {
    // silent fallback
  }

  return result;
}
