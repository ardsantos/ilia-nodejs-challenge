import prisma from "../db";
import { Prisma, Wallet, Transaction } from "../generated/prisma/client";

type PrismaTransactionClient = Prisma.TransactionClient;

interface CreateTransactionData {
  amount: number;
  type: "CREDIT" | "DEBIT";
  walletId: string;
}

export class TransactionRepository {
  /**
   * Find wallet by userId with optional transaction client for ACID operations
   */
  async findByUserId(
    userId: string,
    tx?: PrismaTransactionClient
  ): Promise<Wallet | null> {
    const client = tx ?? prisma;
    return client.wallet.findUnique({
      where: { user_id: userId },
    });
  }

  /**
   * Create a new wallet for a user
   */
  async createWallet(
    userId: string,
    tx?: PrismaTransactionClient
  ): Promise<Wallet> {
    const client = tx ?? prisma;
    return client.wallet.create({
      data: { user_id: userId },
    });
  }

  /**
   * Create a transaction record
   */
  async createTransaction(
    data: CreateTransactionData,
    tx?: PrismaTransactionClient
  ): Promise<Transaction> {
    const client = tx ?? prisma;
    return client.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        walletId: data.walletId,
      },
    });
  }

  /**
   * Get aggregated balance for a wallet using groupBy
   * Returns (sum of CREDIT) - (sum of DEBIT)
   */
  async getAggregatedBalance(
    walletId: string,
    tx?: PrismaTransactionClient
  ): Promise<number> {
    const client = tx ?? prisma;

    const grouped = await client.transaction.groupBy({
      by: ["type"],
      where: { walletId },
      _sum: { amount: true },
    });

    let credits = 0;
    let debits = 0;

    for (const group of grouped) {
      if (group.type === "CREDIT") {
        credits = group._sum.amount ?? 0;
      } else if (group.type === "DEBIT") {
        debits = group._sum.amount ?? 0;
      }
    }

    return credits - debits;
  }
}

export const transactionRepository = new TransactionRepository();
