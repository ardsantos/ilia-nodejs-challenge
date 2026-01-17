import { TransactionRepository } from "../../repositories/transaction.repository";
import prisma from "../../db";

// Mock the Prisma client
jest.mock("../../db", () => ({
    __esModule: true,
    default: {
        wallet: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
            groupBy: jest.fn(),
            findMany: jest.fn(),
        },
    },
}));

describe("TransactionRepository", () => {
    let repository: TransactionRepository;

    beforeEach(() => {
        repository = new TransactionRepository();
        jest.clearAllMocks();
    });

    describe("findByUserId", () => {
        it("should find a wallet by user ID", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

            const result = await repository.findByUserId("user-123");

            expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
                where: { user_id: "user-123" },
            });
            expect(result).toEqual(mockWallet);
        });

        it("should return null if wallet not found", async () => {
            (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await repository.findByUserId("nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("createWallet", () => {
        it("should create a new wallet", async () => {
            const mockWallet = {
                id: "new-wallet-id",
                user_id: "user-123",
                createdAt: new Date(),
            };

            (prisma.wallet.create as jest.Mock).mockResolvedValue(mockWallet);

            const result = await repository.createWallet("user-123");

            expect(prisma.wallet.create).toHaveBeenCalledWith({
                data: { user_id: "user-123" },
            });
            expect(result).toEqual(mockWallet);
        });
    });

    describe("createTransaction", () => {
        it("should create a credit transaction", async () => {
            const transactionData = {
                amount: 100,
                type: "CREDIT" as const,
                walletId: "wallet-123",
            };

            const mockTransaction = {
                id: "tx-123",
                ...transactionData,
                createdAt: new Date(),
            };

            (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await repository.createTransaction(transactionData);

            expect(prisma.transaction.create).toHaveBeenCalledWith({
                data: transactionData,
            });
            expect(result).toEqual(mockTransaction);
        });

        it("should create a debit transaction", async () => {
            const transactionData = {
                amount: 50,
                type: "DEBIT" as const,
                walletId: "wallet-123",
            };

            const mockTransaction = {
                id: "tx-456",
                ...transactionData,
                createdAt: new Date(),
            };

            (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await repository.createTransaction(transactionData);

            expect(result).toEqual(mockTransaction);
        });
    });

    describe("getAggregatedBalance", () => {
        it("should calculate balance correctly with credits and debits", async () => {
            const mockGroupedData = [
                { type: "CREDIT", _sum: { amount: 500 } },
                { type: "DEBIT", _sum: { amount: 200 } },
            ];

            (prisma.transaction.groupBy as jest.Mock).mockResolvedValue(mockGroupedData);

            const result = await repository.getAggregatedBalance("wallet-123");

            expect(prisma.transaction.groupBy).toHaveBeenCalledWith({
                by: ["type"],
                where: { walletId: "wallet-123" },
                _sum: { amount: true },
            });
            expect(result).toBe(300); // 500 - 200
        });

        it("should return correct balance with only credits", async () => {
            const mockGroupedData = [{ type: "CREDIT", _sum: { amount: 1000 } }];

            (prisma.transaction.groupBy as jest.Mock).mockResolvedValue(mockGroupedData);

            const result = await repository.getAggregatedBalance("wallet-123");

            expect(result).toBe(1000);
        });

        it("should return correct balance with only debits", async () => {
            const mockGroupedData = [{ type: "DEBIT", _sum: { amount: 300 } }];

            (prisma.transaction.groupBy as jest.Mock).mockResolvedValue(mockGroupedData);

            const result = await repository.getAggregatedBalance("wallet-123");

            expect(result).toBe(-300);
        });

        it("should return 0 for wallet with no transactions", async () => {
            (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([]);

            const result = await repository.getAggregatedBalance("wallet-123");

            expect(result).toBe(0);
        });
    });

    describe("findTransactionsByWalletId", () => {
        it("should find all transactions for a wallet", async () => {
            const mockTransactions = [
                {
                    id: "tx-1",
                    amount: 100,
                    type: "CREDIT",
                    walletId: "wallet-123",
                    createdAt: new Date("2024-01-15"),
                },
                {
                    id: "tx-2",
                    amount: 50,
                    type: "DEBIT",
                    walletId: "wallet-123",
                    createdAt: new Date("2024-01-14"),
                },
            ];

            (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

            const result = await repository.findTransactionsByWalletId("wallet-123");

            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                where: { walletId: "wallet-123" },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(mockTransactions);
        });

        it("should filter transactions by CREDIT type", async () => {
            const mockCreditTransactions = [
                {
                    id: "tx-1",
                    amount: 100,
                    type: "CREDIT",
                    walletId: "wallet-123",
                    createdAt: new Date("2024-01-15"),
                },
            ];

            (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockCreditTransactions);

            const result = await repository.findTransactionsByWalletId("wallet-123", "CREDIT");

            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                where: { walletId: "wallet-123", type: "CREDIT" },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(mockCreditTransactions);
        });

        it("should filter transactions by DEBIT type", async () => {
            const mockDebitTransactions = [
                {
                    id: "tx-2",
                    amount: 50,
                    type: "DEBIT",
                    walletId: "wallet-123",
                    createdAt: new Date("2024-01-14"),
                },
            ];

            (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockDebitTransactions);

            const result = await repository.findTransactionsByWalletId("wallet-123", "DEBIT");

            expect(prisma.transaction.findMany).toHaveBeenCalledWith({
                where: { walletId: "wallet-123", type: "DEBIT" },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(mockDebitTransactions);
        });

        it("should return empty array for wallet with no transactions", async () => {
            (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);

            const result = await repository.findTransactionsByWalletId("wallet-123");

            expect(result).toEqual([]);
        });
    });
});
