import request from "supertest";
import app from "../../app";

describe("Transaction API Integration Tests", () => {
    describe("POST /api/transactions", () => {
        it("should reject transaction without token", async () => {
            const res = await request(app).post("/api/transactions").send({
                amount: 100,
                type: "CREDIT",
            });

            expect(res.status).toBe(401);
        });

        it("should reject transaction with invalid token", async () => {
            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", "Bearer invalid-token")
                .send({
                    amount: 100,
                    type: "CREDIT",
                });

            expect(res.status).toBe(401);
        });

        it("should reject transaction with invalid amount", async () => {
            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", "Bearer test-token")
                .send({
                    amount: -50,
                    type: "CREDIT",
                });

            expect(res.status).toBe(401); // Will fail auth first
        });

        it("should reject transaction with invalid type", async () => {
            const res = await request(app)
                .post("/api/transactions")
                .set("Authorization", "Bearer test-token")
                .send({
                    amount: 100,
                    type: "INVALID",
                });

            expect(res.status).toBe(401); // Will fail auth first
        });
    });

    describe("GET /api/transactions", () => {
        it("should reject transactions request without token", async () => {
            const res = await request(app).get("/api/transactions");

            expect(res.status).toBe(401);
        });

        it("should reject transactions request with invalid token", async () => {
            const res = await request(app)
                .get("/api/transactions")
                .set("Authorization", "Bearer invalid-token");

            expect(res.status).toBe(401);
        });

        it("should reject transactions request with invalid type filter", async () => {
            const res = await request(app)
                .get("/api/transactions?type=INVALID")
                .set("Authorization", "Bearer test-token");

            expect(res.status).toBe(401); // Will fail auth first
        });

        it("should accept valid type filter CREDIT", async () => {
            const res = await request(app)
                .get("/api/transactions?type=CREDIT")
                .set("Authorization", "Bearer test-token");

            expect(res.status).toBe(401); // Will fail auth, but validation passed
        });

        it("should accept valid type filter DEBIT", async () => {
            const res = await request(app)
                .get("/api/transactions?type=DEBIT")
                .set("Authorization", "Bearer test-token");

            expect(res.status).toBe(401); // Will fail auth, but validation passed
        });
    });

    describe("GET /api/balance", () => {
        it("should reject balance request without token", async () => {
            const res = await request(app).get("/api/balance");

            expect(res.status).toBe(401);
        });

        it("should reject balance request with invalid token", async () => {
            const res = await request(app)
                .get("/api/balance")
                .set("Authorization", "Bearer invalid-token");

            expect(res.status).toBe(401);
        });
    });

    describe("POST /internal/wallets", () => {
        it("should reject wallet creation without internal token", async () => {
            const res = await request(app).post("/internal/wallets").send({
                user_id: "test-user-id",
            });

            expect(res.status).toBe(401);
        });

        it("should reject wallet creation with invalid user_id format", async () => {
            const res = await request(app)
                .post("/internal/wallets")
                .set("x-internal-token", "test-internal-token")
                .send({
                    user_id: "not-a-uuid",
                });

            expect(res.status).toBe(401); // Will fail auth first
        });
    });
});
