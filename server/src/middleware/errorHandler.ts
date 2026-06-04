import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

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
  let message = "Internal server error";

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((validationError) => validationError.message)
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
  }

  const body: ErrorResponseBody = { success: false, message };

  if (process.env.NODE_ENV !== "production" && err instanceof Error && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
