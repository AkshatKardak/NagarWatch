import type { Request } from "express";
import multer, { MulterError } from "multer";
import type { FileFilterCallback } from "multer";

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * fileFilter — rejects non-image uploads.
 *
 * IMPORTANT: We throw a MulterError instead of a plain Error so that
 * Express errorHandler can distinguish it and return 400 (not 500).
 * Plain Error instances thrown from fileFilter are not wrapped by Multer
 * and fall through as unrecognised errors → 500. MulterError instances
 * are always passed to next() by Multer and reach errorHandler correctly.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  // Reuse LIMIT_UNEXPECTED_FILE as the closest built-in code; the message
  // is overridden to be user-friendly. errorHandler maps all non-size
  // MulterErrors to 400.
  const err = new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
  err.message = `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WebP images are allowed.`;
  cb(err);
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5 MB

export const uploadSingle = multer({ storage, fileFilter, limits }).single("image");
export const uploadFields  = multer({ storage, fileFilter, limits }).fields([
  { name: "beforeImage", maxCount: 1 },
  { name: "afterImage",  maxCount: 1 },
]);
