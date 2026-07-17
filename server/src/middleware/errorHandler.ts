import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import multer from "multer";
import mongoose from "mongoose";
import type { CloudinaryUploadError } from "../config/cloudinary";

interface ErrorWithCode extends Error {
  code?: number;
}

interface ErrorResponseBody {
  success: false;
  message: string;
  stack?: string;
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(err);

  let statusCode = 500;
  let message    = "Internal server error";

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");

  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid ID format";

  } else if (err instanceof Error && (err as ErrorWithCode).code === 11000) {
    statusCode = 409;
    message = "Duplicate entry - resource already exists";

  } else if (err instanceof multer.MulterError) {
    // LIMIT_FILE_SIZE is the only Multer built-in that maps to 413.
    // All other MulterErrors (including our MIME-rejection reusing
    // LIMIT_UNEXPECTED_FILE) map to 400 with the human-readable message.
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 5 MB."
        : err.message; // our custom MIME message bubbles up here

  } else if (err instanceof Error && err.message.includes("File too large")) {
    // Fallback for any plain-Error file-size path (belt-and-suspenders)
    statusCode = 413;
    message = "File too large. Maximum size is 5 MB.";

  } else if (
    err instanceof Error &&
    (err.message.startsWith("Cloudinary upload failed") ||
      err.message.toLowerCase().includes("cloudinary"))
  ) {
    const cloudErr = err as CloudinaryUploadError;
    statusCode = 500;
    message = `Image upload error: ${cloudErr.message}`;
    console.error(
      `[Cloudinary] http_code=${cloudErr.http_code ?? "unknown"} — ${cloudErr.message}\n` +
      "Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in your .env"
    );

  } else if (err instanceof Error) {
    message = err.message || message;
  }

  const body: ErrorResponseBody = { success: false, message };

  if (process.env.NODE_ENV !== "production" && err instanceof Error && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
