import express, { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createTransactionHandler,
  getBalanceHandler,
  getTransactionsHandler,
} from "../controllers/transaction.controller";

const router: Router = express.Router();

router.post("/transactions", authenticate, createTransactionHandler);
router.get("/transactions", authenticate, getTransactionsHandler);
router.get("/balance", authenticate, getBalanceHandler);

export default router;
