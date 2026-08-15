import { v2 as cloudinary } from "cloudinary";

// ---------------------------------------------------------------------------
// Validate credentials at module load time so the server fails fast with a
// clear message instead of a silent HTTP 401 from Cloudinary at upload time.
// ---------------------------------------------------------------------------
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey    = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const missingVars: string[] = [];
if (!cloudName)  missingVars.push("CLOUDINARY_CLOUD_NAME");
if (!apiKey)     missingVars.push("CLOUDINARY_API_KEY");
if (!apiSecret)  missingVars.push("CLOUDINARY_API_SECRET");

const cloudinaryConfigured = missingVars.length === 0;

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName as string,
    api_key:    apiKey    as string,
    api_secret: apiSecret as string,
  });
  console.log("✅ Cloudinary configured successfully");
} else {
  console.warn(
    `⚠️  Cloudinary NOT configured — missing env vars: ${missingVars.join(", ")}. ` +
    "Image uploads will use a placeholder URL. " +
    "Set these values in your .env / hosting dashboard and restart the server."
  );
}

// ---------------------------------------------------------------------------
// Typed Cloudinary error interface so errorHandler can inspect http_code.
// ---------------------------------------------------------------------------
export interface CloudinaryUploadError extends Error {
  http_code?: number;
  error?: { message: string; http_code?: number };
}

// ---------------------------------------------------------------------------
// uploadImage — thin wrapper around cloudinary.uploader.upload.
// Falls back to a placeholder when credentials are absent.
// Throws a typed CloudinaryUploadError so the Express errorHandler can map
// it to a meaningful 500 response rather than a generic one.
// ---------------------------------------------------------------------------
export async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  if (!cloudinaryConfigured) {
    console.log(`[CLOUDINARY MOCK] Would upload image to folder '${folder}'`);
    return "https://placehold.co/600x400?text=No+Image";
  }

  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;

  try {
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    console.log(`📸 Image uploaded → ${result.secure_url}`);
    return result.secure_url;
  } catch (err: unknown) {
    // Cloudinary SDK throws plain objects; normalise to an Error instance
    // so Express errorHandler receives a proper err.message / err.stack.
    const raw = err as { http_code?: number; error?: { message?: string; http_code?: number }; message?: string };
    const httpCode  = (raw?.http_code ?? raw?.error?.http_code ?? 500) as number;
    const rawMsg    = (raw?.message ?? raw?.error?.message ?? "Upload failed") as string;
    const uploadErr = new Error(
      `Cloudinary upload failed (HTTP ${httpCode}): ${rawMsg}`
    ) as CloudinaryUploadError;
    uploadErr.http_code = httpCode;
    throw uploadErr;
  }
}

export default cloudinary;
