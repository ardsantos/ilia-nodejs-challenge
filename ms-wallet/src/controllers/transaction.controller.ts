import { Request, Response } from "express";
import Joi from "joi";
import * as transactionService from "../services/transaction.service";

const createTransactionSchema = Joi.object({
  amount: Joi.number().integer().min(1).required().messages({
    "number.base": "Amount must be a number",
    "number.integer": "Amount must be an integer (cents)",
    "number.min": "Amount must be greater than 0",
    "any.required": "Amount is required",
  }),
  type: Joi.string().valid("CREDIT", "DEBIT").required().messages({
    "any.only": "Type must be either CREDIT or DEBIT",
    "any.required": "Type is required",
  }),
  user_id: Joi.forbidden().messages({
    "any.unknown": "user_id cannot be provided in request body",
  }),
});

/**
 * Create a new transaction
 * POST /api/transactions
 *
 * Security: Uses req.userId from auth middleware, ignores any user_id in body
 */
export async function createTransactionHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { error, value } = createTransactionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(", ");
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const transaction = await transactionService.createTransaction({
      userId: req.userId,
      amount: value.amount,
      type: value.type,
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Transaction creation failed:", error);

    if (error instanceof Error) {
      if (error.message === "Insufficient funds") {
        res.status(400).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get balance for authenticated user
 * GET /api/balance
 */
export async function getBalanceHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const balance = await transactionService.getBalance(req.userId);

    res.status(200).json(balance);
  } catch (error) {
    console.error("Get balance failed:", error);

    if (error instanceof Error) {
      if (error.message === "Wallet not found") {
        res.status(404).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: "Internal server error" });
  }
}
