import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

if (!process.env.JWT_SECRET_INTERNAL) {
  throw new Error("FATAL: JWT_SECRET_INTERNAL environment variable is not set");
}

interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract token from Authorization header
 * Expected format: "Bearer <token>"
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

/**
 * Authenticate user requests using JWT_SECRET
 * Attaches userId to req.userId if valid
 * Returns 401 Unauthorized if token is missing or invalid
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Authenticate internal service-to-service requests using JWT_SECRET_INTERNAL
 * Validates token from x-internal-token header
 * Returns 403 Forbidden if token is invalid
 */
export function authenticateInternal(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers["x-internal-token"] as string | undefined;

  if (!token) {
    res.status(403).json({ error: "No internal token provided" });
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET_INTERNAL as string);
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid internal token" });
  }
}
