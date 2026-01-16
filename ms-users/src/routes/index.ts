import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

const router = Router();

// Auth routes (public)
router.use(authRoutes);

// User routes (protected - authentication is applied in user.routes.ts)
router.use("/users", userRoutes);

export default router;
