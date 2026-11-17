import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User, IUser } from "../../models/User";
import { Complaint, IComplaint, ComplaintCategory, ComplaintStatus } from "../../models/Complaint";
import { Ward, IWard } from "../../models/Ward";

let mongoServer: MongoMemoryServer | null = null;

export async function setupMemoryDB(): Promise<string> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await Complaint.createIndexes();
    await Ward.createIndexes();
    await User.createIndexes();
  }
  return mongoServer.getUri();
}

export async function teardownMemoryDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearDB(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
}

export async function createTestUser(overrides: Partial<IUser> = {}): Promise<IUser> {
  const clerkId = overrides.clerkId || `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const user = await User.create({
    clerkId,
    email: overrides.email || `${clerkId}@nagarwatch.test`,
    name: overrides.name || "Test User",
    role: overrides.role || "citizen",
    ...overrides,
  });
  return user;
}

export async function createTestComplaint(
  userId: mongoose.Types.ObjectId,
  overrides: Partial<IComplaint> = {}
): Promise<IComplaint> {
  const category: ComplaintCategory = overrides.category || "pothole";
  const deadline = overrides.sla?.deadline || new Date(Date.now() + 72 * 3600 * 1000);

  const complaint = await Complaint.create({
    title: overrides.title || "Test Civic Issue",
    description: overrides.description || "Detailed grievance description of civic issue",
    category,
    status: (overrides.status as ComplaintStatus) || "pending",
    priority: overrides.priority || "high",
    priorityScore: overrides.priorityScore || 65,
    location: overrides.location || {
      type: "Point",
      coordinates: [72.8777, 19.0760], // Mumbai coordinates
      address: "MG Road, Ward 12, Mumbai",
    },
    images: overrides.images || {
      before: "https://placehold.co/600x400?text=Pothole+Before",
    },
    submittedBy: userId,
    sla: {
      deadline,
      breached: overrides.sla?.breached ?? false,
      warningEmailSent: overrides.sla?.warningEmailSent ?? false,
      escalationLevel: overrides.sla?.escalationLevel ?? 0,
      escalationLog: overrides.sla?.escalationLog || [],
      ...overrides.sla,
    },
    statusHistory: overrides.statusHistory || [
      {
        status: (overrides.status as string) || "pending",
        updatedBy: userId,
        updatedAt: new Date(),
        note: "Initial report submitted",
      },
    ],
    ...overrides,
  });

  return complaint;
}
