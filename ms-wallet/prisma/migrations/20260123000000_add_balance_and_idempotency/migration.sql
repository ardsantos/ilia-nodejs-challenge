-- AlterTable: Add balance field to wallets
ALTER TABLE "wallets" ADD COLUMN "balance" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Add idempotencyKey field to transactions
ALTER TABLE "transactions" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex: Unique constraint on idempotencyKey
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- Backfill existing wallet balances
UPDATE "wallets" w
SET "balance" = COALESCE((
    SELECT SUM(CASE WHEN t."type" = 'CREDIT' THEN t."amount" ELSE -t."amount" END)
    FROM "transactions" t
    WHERE t."walletId" = w."id"
), 0);
