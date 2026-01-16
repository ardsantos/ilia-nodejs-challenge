import { userRepository } from "../repositories/user.repository";
import { hashPassword, comparePassword } from "../utils/password.util";
import { signToken } from "../utils/jwt.util";
import { walletClient } from "./wallet.client";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  token: string;
}

/**
 * Register a new user and create their wallet
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  // Check if email already exists
  const existingUser = await userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await userRepository.create({
    email: data.email,
    password: hashedPassword,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  // Create wallet for the user in ms-wallet
  try {
    await walletClient.createWallet(user.id);
  } catch (error) {
    console.error("Failed to create wallet for user:", error);
    // Continue with registration even if wallet creation fails
    // The wallet can be created later or manually
  }

  // Generate token
  const token = signToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token,
  };
}

/**
 * Login a user with email and password
 */
export async function login(data: LoginData): Promise<AuthResult> {
  // Find user by email
  const user = await userRepository.findByEmail(data.email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate token
  const token = signToken(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token,
  };
}
