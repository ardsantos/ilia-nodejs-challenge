import prisma from "../db";
import { Prisma } from "../generated/prisma/client";
import { transactionRepository } from "../repositories/transaction.repository";

interface CreateTransactionDTO {
  userId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  idempotencyKey?: string;
}

interface BalanceDTO {
  amount: number;
}

interface TransactionResult {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  createdAt: Date;
  walletId: string;
}

interface TransactionDTO {
  id: string;
  user_id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
}

/**
 * Create a transaction with ACID guarantees and idempotency
 * - Checks for existing transaction with same idempotency key
 * - Atomically finds or creates wallet
 * - For DEBIT: validates sufficient funds using materialized balance
 * - Creates transaction record and updates wallet balance atomically
 */
export async function createTransaction(data: CreateTransactionDTO): Promise<TransactionResult> {
  if (data.idempotencyKey) {
    const existing = await transactionRepository.findByIdempotencyKey(data.idempotencyKey);
    if (existing) {
      return {
        id: existing.id,
        amount: existing.amount,
        type: existing.type as "CREDIT" | "DEBIT",
        createdAt: existing.createdAt,
        walletId: existing.walletId,
      };
    }
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (data.idempotencyKey) {
      const existing = await transactionRepository.findByIdempotencyKey(data.idempotencyKey, tx);
      if (existing) {
        return existing;
      }
    }

    let wallet = await transactionRepository.findByUserId(data.userId, tx);

    if (!wallet) {
      wallet = await transactionRepository.createWallet(data.userId, tx);
    }

    if (data.type === "DEBIT") {
      if (wallet.balance < data.amount) {
        throw new Error("Insufficient funds");
      }
    }

    const transaction = await transactionRepository.createTransaction(
      {
        amount: data.amount,
        type: data.type,
        walletId: wallet.id,
        idempotencyKey: data.idempotencyKey,
      },
      tx
    );

    await transactionRepository.updateWalletBalance(wallet.id, data.amount, data.type, tx);

    return transaction;
  });

  return {
    id: result.id,
    amount: result.amount,
    type: result.type as "CREDIT" | "DEBIT",
    createdAt: result.createdAt,
    walletId: result.walletId,
  };
}

/**
 * Get balance for a user - O(1) read from materialized balance
 * - Finds wallet by userId
 * - Returns stored balance directly (no aggregation needed)
 */
export async function getBalance(userId: string): Promise<BalanceDTO> {
  const wallet = await transactionRepository.findByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  return { amount: wallet.balance };
}

/**
 * Get balance using aggregation (for reconciliation/audit purposes)
 * - Calculates balance by summing all transactions
 * - Use this to verify materialized balance accuracy
 */
export async function getAggregatedBalance(userId: string): Promise<BalanceDTO> {
  const wallet = await transactionRepository.findByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const amount = await transactionRepository.getAggregatedBalance(wallet.id);

  return { amount };
}

/**
 * Get all transactions for a user with optional type filter
 * - Finds wallet by userId
 * - Retrieves transactions filtered by type if provided
 * - Maps to OpenAPI TransactionsModel schema
 */
export async function getTransactions(
  userId: string,
  type?: "CREDIT" | "DEBIT"
): Promise<TransactionDTO[]> {
  const wallet = await transactionRepository.findByUserId(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const transactions = await transactionRepository.findTransactionsByWalletId(wallet.id, type);

  return transactions.map((t) => ({
    id: t.id,
    user_id: wallet.user_id,
    amount: t.amount,
    type: t.type as "CREDIT" | "DEBIT",
  }));
}
