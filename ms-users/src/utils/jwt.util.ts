import jwt from "jsonwebtoken";

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
 * Sign a JWT token for user authentication
 */
export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: "24h",
  });
}

/**
 * Verify a JWT token and return the payload
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
}

/**
 * Sign an internal JWT token for service-to-service communication
 */
export function signInternalToken(): string {
  return jwt.sign({ service: "ms-users" }, process.env.JWT_SECRET_INTERNAL as string, {
    expiresIn: "5m",
  });
}
