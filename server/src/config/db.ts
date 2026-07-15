import mongoose from "mongoose";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MongoDB connection failed: MONGODB_URI is not configured");
    process.exit(1);
  }

  // Mask credentials in logs
  const maskedUri = mongoUri.replace(/:\/\/[^@]+@/, "://***:***@");
  console.log("Connecting to MongoDB:", maskedUri);

  mongoose.connection.on("connected", () =>
    console.log("MongoDB connected successfully")
  );
  mongoose.connection.on("error", (err) =>
    console.error("MongoDB connection error:", err.message)
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("MongoDB disconnected — will attempt to reconnect")
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      });
      return; // connected — exit
    } catch (error: any) {
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`
      );
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.error("All MongoDB connection attempts exhausted. Exiting.");
        process.exit(1);
      }
    }
  }
}
