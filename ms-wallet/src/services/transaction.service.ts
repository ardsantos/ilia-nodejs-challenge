import prisma from "../db";
import { Prisma } from "../generated/prisma/client";
import { transactionRepository } from "../repositories/transaction.repository";

interface CreateTransactionDTO {
  userId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
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
 * Create a transaction with ACID guarantees
 * - Atomically finds or creates wallet
 * - For DEBIT: validates sufficient funds within the transaction
 * - Creates transaction record
 */
export async function createTransaction(
  data: CreateTransactionDTO
): Promise<TransactionResult> {
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      let wallet = await transactionRepository.findByUserId(data.userId, tx);

      if (!wallet) {
        wallet = await transactionRepository.createWallet(data.userId, tx);
      }

      if (data.type === "DEBIT") {
        const balance = await transactionRepository.getAggregatedBalance(
          wallet.id,
          tx
        );

        if (balance < data.amount) {
          throw new Error("Insufficient funds");
        }
      }

      const transaction = await transactionRepository.createTransaction(
        {
          amount: data.amount,
          type: data.type,
          walletId: wallet.id,
        },
        tx
      );

      return transaction;
    }
  );

  return {
    id: result.id,
    amount: result.amount,
    type: result.type as "CREDIT" | "DEBIT",
    createdAt: result.createdAt,
    walletId: result.walletId,
  };
}

/**
 * Get balance for a user
 * - Finds wallet by userId
 * - Calculates balance via aggregation (NEVER stored)
 * - Returns amount (credits - debits)
 */
export async function getBalance(userId: string): Promise<BalanceDTO> {
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

  const transactions = await transactionRepository.findTransactionsByWalletId(
    wallet.id,
    type
  );

  return transactions.map((t) => ({
    id: t.id,
    user_id: wallet.user_id,
    amount: t.amount,
    type: t.type as "CREDIT" | "DEBIT",
  }));
}
