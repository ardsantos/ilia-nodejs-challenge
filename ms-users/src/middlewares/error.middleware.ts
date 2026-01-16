import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ error: message });
}
