import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/user.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /users - Get all users
router.get("/", getAllUsersHandler);

// GET /users/:id - Get user by ID
router.get("/:id", getUserByIdHandler);

// PATCH /users/:id - Update user
router.patch("/:id", updateUserHandler);

// DELETE /users/:id - Delete user
router.delete("/:id", deleteUserHandler);

export default router;
