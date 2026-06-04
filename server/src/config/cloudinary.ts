import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName as string,
    api_key: apiKey as string,
    api_secret: apiSecret as string,
  });
  console.log("Cloudinary configured");
} else {
  console.warn("Cloudinary not configured - using mock uploads");
}

export async function uploadImage(buffer: Buffer, folder: string): Promise<string> {
  if (!cloudinaryConfigured) {
    console.log(`[CLOUDINARY MOCK] Would upload image to ${folder}`);
    return "https://placehold.co/600x400?text=No+Image";
  }

  const dataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });

  console.log(`Image uploaded to Cloudinary folder ${folder}`);
  return result.secure_url;
}

export default cloudinary;
