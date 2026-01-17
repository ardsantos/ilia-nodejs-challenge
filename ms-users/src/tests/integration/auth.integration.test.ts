import request from "supertest";
import app from "../../app";

describe("Auth API Integration Tests", () => {
    describe("POST /api/users", () => {
        it("should reject registration with invalid email", async () => {
            const res = await request(app).post("/api/users").send({
                email: "invalid-email",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should reject registration with short password", async () => {
            const res = await request(app).post("/api/users").send({
                email: "test@example.com",
                password: "123",
                firstName: "John",
                lastName: "Doe",
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should reject registration without required fields", async () => {
            const res = await request(app).post("/api/users").send({
                email: "test@example.com",
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("POST /api/auth", () => {
        it("should reject login with invalid email format", async () => {
            const res = await request(app).post("/api/auth").send({
                email: "invalid-email",
                password: "password123",
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should reject login without password", async () => {
            const res = await request(app).post("/api/auth").send({
                email: "test@example.com",
            });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });
    });
});
