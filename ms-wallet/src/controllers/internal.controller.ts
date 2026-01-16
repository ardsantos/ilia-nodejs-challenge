import { Request, Response } from "express";
import Joi from "joi";
import { transactionRepository } from "../repositories/transaction.repository";

const createWalletSchema = Joi.object({
  user_id: Joi.string().uuid().required().messages({
    "string.guid": "user_id must be a valid UUID",
    "any.required": "user_id is required",
  }),
});

/**
 * Create a wallet for a user (internal service-to-service endpoint)
 * POST /internal/wallets
 */
export async function createWalletHandler(req: Request, res: Response): Promise<void> {
  try {
    const { error, value } = createWalletSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(", ");
      res.status(400).json({ error: "Validation failed", details });
      return;
    }

    // Check if wallet already exists
    const existingWallet = await transactionRepository.findByUserId(value.user_id);
    if (existingWallet) {
      res.status(409).json({ error: "Wallet already exists for this user" });
      return;
    }

    const wallet = await transactionRepository.createWallet(value.user_id);

    res.status(201).json({
      id: wallet.id,
      user_id: wallet.user_id,
      createdAt: wallet.createdAt,
    });
  } catch (err) {
    console.error("Create wallet failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
