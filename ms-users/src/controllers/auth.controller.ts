import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { registerSchema, loginSchema } from "../validations/auth.validation";

/**
 * Register a new user
 * POST /users
 */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(", ");
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    const result = await authService.register({
      email: value.email,
      password: value.password,
      firstName: value.first_name,
      lastName: value.last_name,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Registration failed:", (err as Error).message);

    if (err instanceof Error) {
      if (err.message === "Email already registered") {
        res.status(409).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Login a user
 * POST /auth
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(", ");
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    const result = await authService.login({
      email: value.email,
      password: value.password,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Login failed:", (err as Error).message);

    if (err instanceof Error) {
      if (err.message === "Invalid credentials") {
        res.status(401).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}
