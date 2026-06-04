import type { Request } from "express";
import multer from "multer";
import type { FileFilterCallback } from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only JPEG, PNG, WebP allowed"));
};

const limits = { fileSize: 5 * 1024 * 1024 };

export const uploadSingle = multer({ storage, fileFilter, limits }).single("image");
export const uploadFields = multer({ storage, fileFilter, limits }).fields([
  { name: "beforeImage", maxCount: 1 },
  { name: "afterImage", maxCount: 1 },
]);
