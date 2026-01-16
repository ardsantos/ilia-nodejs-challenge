import prisma from "../db";
import { Prisma, User } from "../generated/prisma/client";

type PrismaTransactionClient = Prisma.TransactionClient;

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export class UserRepository {
  /**
   * Find user by ID with optional transaction client
   */
  async findById(id: string, tx?: PrismaTransactionClient): Promise<User | null> {
    const client = tx ?? prisma;
    return client.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email with optional transaction client
   */
  async findByEmail(email: string, tx?: PrismaTransactionClient): Promise<User | null> {
    const client = tx ?? prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find all users
   */
  async findAll(tx?: PrismaTransactionClient): Promise<User[]> {
    const client = tx ?? prisma;
    return client.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create a new user
   */
  async create(data: CreateUserData, tx?: PrismaTransactionClient): Promise<User> {
    const client = tx ?? prisma;
    return client.user.create({
      data: {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  /**
   * Update a user
   */
  async update(id: string, data: UpdateUserData, tx?: PrismaTransactionClient): Promise<User> {
    const client = tx ?? prisma;
    return client.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a user
   */
  async delete(id: string, tx?: PrismaTransactionClient): Promise<User> {
    const client = tx ?? prisma;
    return client.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
