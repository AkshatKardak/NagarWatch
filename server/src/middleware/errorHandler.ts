import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
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
  } else if (err instanceof Error && err.message.includes("File too large")) {
    statusCode = 413;
    message = "File too large. Maximum size is 5MB";
  } else if (
    err instanceof Error &&
    (err.message.startsWith("Cloudinary upload failed") ||
      err.message.toLowerCase().includes("cloudinary"))
  ) {
    // Surface Cloudinary-specific errors with a clear 500 body so developers
    // immediately see the real cause (e.g. Invalid cloud_name, Wrong API key)
    // rather than a generic 'Internal server error'.
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
