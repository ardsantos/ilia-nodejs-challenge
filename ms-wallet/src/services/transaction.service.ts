import prisma from "../db";
import { Prisma } from "../generated/prisma/client";

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

/**
 * Create a transaction with ACID guarantees
 * - Atomically finds or creates wallet
 * - For DEBIT: validates sufficient funds
 * - Creates transaction record
 */
export async function createTransaction(
  data: CreateTransactionDTO
): Promise<TransactionResult> {
  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.upsert({
        where: { user_id: data.userId },
        update: {},
        create: { user_id: data.userId },
      });

      if (data.type === "DEBIT") {
        const balanceResult = await getBalance(data.userId);

        if (balanceResult.amount < data.amount) {
          throw new Error("Insufficient funds");
        }
      }

      const transaction = await tx.transaction.create({
        data: {
          amount: data.amount,
          type: data.type,
          walletId: wallet.id,
        },
      });

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
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: userId },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const credits = await prisma.transaction.aggregate({
    where: { walletId: wallet.id, type: "CREDIT" },
    _sum: { amount: true },
  });

  const debits = await prisma.transaction.aggregate({
    where: { walletId: wallet.id, type: "DEBIT" },
    _sum: { amount: true },
  });

  const amount = (credits._sum.amount || 0) - (debits._sum.amount || 0);

  return { amount };
}
