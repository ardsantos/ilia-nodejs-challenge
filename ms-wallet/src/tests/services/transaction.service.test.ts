import * as transactionService from "../../services/transaction.service";
import { transactionRepository } from "../../repositories/transaction.repository";
import prisma from "../../db";

// Mock the repository and prisma
jest.mock("../../repositories/transaction.repository");
jest.mock("../../db", () => ({
    __esModule: true,
    default: {
        $transaction: jest.fn(),
    },
}));

describe("TransactionService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createTransaction", () => {
        it("should create a credit transaction and auto-create wallet if needed", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockTransaction = {
                id: "tx-123",
                amount: 100,
                type: "CREDIT",
                walletId: "wallet-123",
                createdAt: new Date(),
            };

            // Mock the $transaction wrapper
            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {};
                (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(null);
                (transactionRepository.createWallet as jest.Mock).mockResolvedValue(mockWallet);
                (transactionRepository.createTransaction as jest.Mock).mockResolvedValue(
                    mockTransaction
                );
                return callback(mockTx);
            });

            const result = await transactionService.createTransaction({
                userId: "user-123",
                amount: 100,
                type: "CREDIT",
            });

            expect(result).toEqual({
                id: "tx-123",
                amount: 100,
                type: "CREDIT",
                walletId: "wallet-123",
                createdAt: mockTransaction.createdAt,
            });
        });

        it("should create transaction with existing wallet", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockTransaction = {
                id: "tx-456",
                amount: 50,
                type: "CREDIT",
                walletId: "wallet-123",
                createdAt: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {};
                (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
                (transactionRepository.createTransaction as jest.Mock).mockResolvedValue(
                    mockTransaction
                );
                return callback(mockTx);
            });

            const result = await transactionService.createTransaction({
                userId: "user-123",
                amount: 50,
                type: "CREDIT",
            });

            expect(result.id).toBe("tx-456");
            expect(transactionRepository.createWallet).not.toHaveBeenCalled();
        });

        it("should allow debit when sufficient balance", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockTransaction = {
                id: "tx-789",
                amount: 50,
                type: "DEBIT",
                walletId: "wallet-123",
                createdAt: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {};
                (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
                (transactionRepository.getAggregatedBalance as jest.Mock).mockResolvedValue(100);
                (transactionRepository.createTransaction as jest.Mock).mockResolvedValue(
                    mockTransaction
                );
                return callback(mockTx);
            });

            const result = await transactionService.createTransaction({
                userId: "user-123",
                amount: 50,
                type: "DEBIT",
            });

            expect(result.type).toBe("DEBIT");
            expect(result.amount).toBe(50);
        });

        it("should reject debit when insufficient balance", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
                const mockTx = {};
                (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
                (transactionRepository.getAggregatedBalance as jest.Mock).mockResolvedValue(30);
                return callback(mockTx);
            });

            await expect(
                transactionService.createTransaction({
                    userId: "user-123",
                    amount: 50,
                    type: "DEBIT",
                })
            ).rejects.toThrow("Insufficient funds");
        });
    });

    describe("getBalance", () => {
        it("should return balance for existing wallet", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
            (transactionRepository.getAggregatedBalance as jest.Mock).mockResolvedValue(250);

            const result = await transactionService.getBalance("user-123");

            expect(result).toEqual({ amount: 250 });
        });

        it("should throw error if wallet not found", async () => {
            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(null);

            await expect(transactionService.getBalance("nonexistent")).rejects.toThrow(
                "Wallet not found"
            );
        });
    });

    describe("getTransactions", () => {
        it("should return all transactions for a user", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockTransactions = [
                {
                    id: "tx-1",
                    amount: 100,
                    type: "CREDIT",
                    walletId: "wallet-123",
                    createdAt: new Date(),
                },
                {
                    id: "tx-2",
                    amount: 50,
                    type: "DEBIT",
                    walletId: "wallet-123",
                    createdAt: new Date(),
                },
            ];

            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
            (transactionRepository.findTransactionsByWalletId as jest.Mock).mockResolvedValue(
                mockTransactions
            );

            const result = await transactionService.getTransactions("user-123");

            expect(transactionRepository.findTransactionsByWalletId).toHaveBeenCalledWith(
                "wallet-123",
                undefined
            );
            expect(result).toEqual([
                {
                    id: "tx-1",
                    user_id: "user-123",
                    amount: 100,
                    type: "CREDIT",
                },
                {
                    id: "tx-2",
                    user_id: "user-123",
                    amount: 50,
                    type: "DEBIT",
                },
            ]);
        });

        it("should filter transactions by CREDIT type", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockCreditTransactions = [
                {
                    id: "tx-1",
                    amount: 100,
                    type: "CREDIT",
                    walletId: "wallet-123",
                    createdAt: new Date(),
                },
            ];

            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
            (transactionRepository.findTransactionsByWalletId as jest.Mock).mockResolvedValue(
                mockCreditTransactions
            );

            const result = await transactionService.getTransactions("user-123", "CREDIT");

            expect(transactionRepository.findTransactionsByWalletId).toHaveBeenCalledWith(
                "wallet-123",
                "CREDIT"
            );
            expect(result).toEqual([
                {
                    id: "tx-1",
                    user_id: "user-123",
                    amount: 100,
                    type: "CREDIT",
                },
            ]);
        });

        it("should filter transactions by DEBIT type", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            const mockDebitTransactions = [
                {
                    id: "tx-2",
                    amount: 50,
                    type: "DEBIT",
                    walletId: "wallet-123",
                    createdAt: new Date(),
                },
            ];

            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
            (transactionRepository.findTransactionsByWalletId as jest.Mock).mockResolvedValue(
                mockDebitTransactions
            );

            const result = await transactionService.getTransactions("user-123", "DEBIT");

            expect(transactionRepository.findTransactionsByWalletId).toHaveBeenCalledWith(
                "wallet-123",
                "DEBIT"
            );
            expect(result).toEqual([
                {
                    id: "tx-2",
                    user_id: "user-123",
                    amount: 50,
                    type: "DEBIT",
                },
            ]);
        });

        it("should return empty array for wallet with no transactions", async () => {
            const mockWallet = {
                id: "wallet-123",
                user_id: "user-123",
                createdAt: new Date(),
            };

            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(mockWallet);
            (transactionRepository.findTransactionsByWalletId as jest.Mock).mockResolvedValue([]);

            const result = await transactionService.getTransactions("user-123");

            expect(result).toEqual([]);
        });

        it("should throw error if wallet not found", async () => {
            (transactionRepository.findByUserId as jest.Mock).mockResolvedValue(null);

            await expect(transactionService.getTransactions("nonexistent")).rejects.toThrow(
                "Wallet not found"
            );
        });
    });
});
