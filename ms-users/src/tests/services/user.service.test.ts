import * as userService from "../../services/user.service";
import { userRepository } from "../../repositories/user.repository";
import * as passwordUtil from "../../utils/password.util";

// Mock the repository and password util
jest.mock("../../repositories/user.repository");
jest.mock("../../utils/password.util");

describe("UserService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("findAll", () => {
        it("should return all users without password", async () => {
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

            (userRepository.findAll as jest.Mock).mockResolvedValue(mockUsers);

            const result = await userService.findAll();

            expect(result).toHaveLength(2);
            expect(result[0]).not.toHaveProperty("password");
            expect(result[1]).not.toHaveProperty("password");
        });
    });

    describe("findById", () => {
        it("should return user by id without password", async () => {
            const mockUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

            const result = await userService.findById("123");

            expect(result).not.toHaveProperty("password");
            expect(result.id).toBe("123");
            expect(result.email).toBe("test@example.com");
        });

        it("should throw error if user not found", async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(userService.findById("nonexistent")).rejects.toThrow(
                "User not found"
            );
        });
    });

    describe("update", () => {
        it("should update user without email change", async () => {
            const existingUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const updatedUser = {
                ...existingUser,
                firstName: "Jane",
            };

            (userRepository.findById as jest.Mock).mockResolvedValue(existingUser);
            (userRepository.update as jest.Mock).mockResolvedValue(updatedUser);

            const result = await userService.update("123", { firstName: "Jane" });

            expect(result.firstName).toBe("Jane");
            expect(userRepository.update).toHaveBeenCalledWith("123", {
                firstName: "Jane",
            });
        });

        it("should hash password when updating", async () => {
            const existingUser = {
                id: "123",
                email: "test@example.com",
                password: "oldhashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (userRepository.findById as jest.Mock).mockResolvedValue(existingUser);
            (passwordUtil.hashPassword as jest.Mock).mockResolvedValue("newhashed");
            (userRepository.update as jest.Mock).mockResolvedValue({
                ...existingUser,
                password: "newhashed",
            });

            await userService.update("123", { password: "newpassword" });

            expect(passwordUtil.hashPassword).toHaveBeenCalledWith("newpassword");
            expect(userRepository.update).toHaveBeenCalledWith("123", {
                password: "newhashed",
            });
        });

        it("should throw error if user not found", async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(
                userService.update("nonexistent", { firstName: "Test" })
            ).rejects.toThrow("User not found");
        });

        it("should throw error if email already in use", async () => {
            const existingUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const otherUser = {
                id: "456",
                email: "other@example.com",
                password: "hashed",
                firstName: "Other",
                lastName: "User",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (userRepository.findById as jest.Mock).mockResolvedValue(existingUser);
            (userRepository.findByEmail as jest.Mock).mockResolvedValue(otherUser);

            await expect(
                userService.update("123", { email: "other@example.com" })
            ).rejects.toThrow("Email already in use");
        });
    });

    describe("deleteUser", () => {
        it("should delete user successfully", async () => {
            const mockUser = {
                id: "123",
                email: "test@example.com",
                password: "hashed",
                firstName: "John",
                lastName: "Doe",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
            (userRepository.delete as jest.Mock).mockResolvedValue(mockUser);

            await userService.deleteUser("123");

            expect(userRepository.delete).toHaveBeenCalledWith("123");
        });

        it("should throw error if user not found", async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);

            await expect(userService.deleteUser("nonexistent")).rejects.toThrow(
                "User not found"
            );
        });
    });
});
