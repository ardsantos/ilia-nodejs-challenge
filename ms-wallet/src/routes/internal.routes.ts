import express, { Router } from "express";
import { authenticateInternal } from "../middlewares/auth.middleware";
import { createWalletHandler } from "../controllers/internal.controller";

const router: Router = express.Router();

// Internal service-to-service endpoint
// Protected by JWT_SECRET_INTERNAL via x-internal-token header
router.post("/wallets", authenticateInternal, createWalletHandler);

export default router;
