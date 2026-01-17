import { UserRepository } from "../../repositories/user.repository";
import prisma from "../../db";

// Mock the Prisma client
jest.mock("../../db", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

describe("UserRepository", () => {
    let repository: UserRepository;

    beforeEach(() => {
        repository = new UserRepository();
        jest.clearAllMocks();
    });

    describe("findById", () => {
        it("should find a user by id", async () => {
            const mockUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await repository.findById("123");

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: "123" },
            });
            expect(result).toEqual(mockUser);
        });

        it("should return null if user not found", async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await repository.findById("nonexistent");

            expect(result).toBeNull();
        });
    });

    describe("findByEmail", () => {
        it("should find a user by email", async () => {
            const mockUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await repository.findByEmail("test@example.com");

            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: "test@example.com" },
            });
            expect(result).toEqual(mockUser);
        });
    });

    describe("create", () => {
        it("should create a new user", async () => {
            const userData = {
                email: "newuser@example.com",
                password: "hashedpassword",
                firstName: "Jane",
                lastName: "Smith",
            };

            const mockCreatedUser = {
                id: "new-id",
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

            const result = await repository.create(userData);

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: userData,
            });
            expect(result).toEqual(mockCreatedUser);
        });
    });

    describe("update", () => {
        it("should update a user", async () => {
            const updateData = {
                firstName: "UpdatedName",
            };

            const mockUpdatedUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "UpdatedName",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

            const result = await repository.update("123", updateData);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: "123" },
                data: updateData,
            });
            expect(result).toEqual(mockUpdatedUser);
        });
    });

    describe("delete", () => {
        it("should delete a user", async () => {
            const mockDeletedUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (prisma.user.delete as jest.Mock).mockResolvedValue(mockDeletedUser);

            const result = await repository.delete("123");

            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: "123" },
            });
            expect(result).toEqual(mockDeletedUser);
        });
    });

    describe("findAll", () => {
        it("should return all users", async () => {
            const mockUsers = [
                {
                    id: "1",
                    email: "user1@example.com",
                    password: "hashed1",
                    firstName: "User",
                    lastName: "One",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "2",
                    email: "user2@example.com",
                    password: "hashed2",
                    firstName: "User",
                    lastName: "Two",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

            const result = await repository.findAll();

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
            });
            expect(result).toEqual(mockUsers);
        });
    });
});
