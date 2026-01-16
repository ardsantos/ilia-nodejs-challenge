import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { updateUserSchema, userIdSchema } from "../validations/user.validation";

/**
 * Get all users
 * GET /users
 * Note: In a production system, this should be restricted to admins only
 */
export async function getAllUsersHandler(req: Request, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const users = await userService.findAll();
    res.status(200).json(users);
  } catch (err) {
    console.error("Get all users failed:", (err as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get user by ID
 * GET /users/:id
 */
export async function getUserByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error } = userIdSchema.validate({ id: req.params.id });
    if (error) {
      res.status(400).json({ error: "Invalid user ID format" });
      return;
    }

    const user = await userService.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    console.error("Get user by ID failed:", (err as Error).message);

    if (err instanceof Error) {
      if (err.message === "User not found") {
        res.status(404).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update user
 * PATCH /users/:id
 * Authorization: Users can only update their own data
 */
export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error: idError } = userIdSchema.validate({ id: req.params.id });
    if (idError) {
      res.status(400).json({ error: "Invalid user ID format" });
      return;
    }

    // Authorization: Users can only update their own data
    if (req.userId !== req.params.id) {
      res.status(403).json({ error: "Forbidden: You can only update your own account" });
      return;
    }

    const { error, value } = updateUserSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(", ");
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    const updateData: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    if (value.email) updateData.email = value.email;
    if (value.password) updateData.password = value.password;
    if (value.first_name) updateData.firstName = value.first_name;
    if (value.last_name) updateData.lastName = value.last_name;

    const user = await userService.update(req.params.id, updateData);
    res.status(200).json(user);
  } catch (err) {
    console.error("Update user failed:", (err as Error).message);

    if (err instanceof Error) {
      if (err.message === "User not found") {
        res.status(404).json({ error: err.message });
        return;
      }
      if (err.message === "Email already in use") {
        res.status(409).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Delete user
 * DELETE /users/:id
 * Authorization: Users can only delete their own account
 */
export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error } = userIdSchema.validate({ id: req.params.id });
    if (error) {
      res.status(400).json({ error: "Invalid user ID format" });
      return;
    }

    // Authorization: Users can only delete their own account
    if (req.userId !== req.params.id) {
      res.status(403).json({ error: "Forbidden: You can only delete your own account" });
      return;
    }

    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error("Delete user failed:", (err as Error).message);

    if (err instanceof Error) {
      if (err.message === "User not found") {
        res.status(404).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}
