import express, { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createTransactionHandler,
  getBalanceHandler,
} from "../controllers/transaction.controller";

const router: Router = express.Router();

router.post("/transactions", authenticate, createTransactionHandler);
router.get("/balance", authenticate, getBalanceHandler);

export default router;
