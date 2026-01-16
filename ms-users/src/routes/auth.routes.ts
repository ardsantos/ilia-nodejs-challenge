import { Router } from "express";
import { registerHandler, loginHandler } from "../controllers/auth.controller";

const router = Router();

// POST /users - Register new user (public)
router.post("/users", registerHandler);

// POST /auth - Login (public)
router.post("/auth", loginHandler);

export default router;
