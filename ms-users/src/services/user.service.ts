import { userRepository } from "../repositories/user.repository";
import { hashPassword } from "../utils/password.util";

interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

function toUserResponse(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  password: string;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Get all users
 */
export async function findAll(): Promise<UserResponse[]> {
  const users = await userRepository.findAll();
  return users.map(toUserResponse);
}

/**
 * Get user by ID
 */
export async function findById(id: string): Promise<UserResponse> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return toUserResponse(user);
}

/**
 * Update user
 */
export async function update(id: string, data: UpdateUserData): Promise<UserResponse> {
  // Check if user exists
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new Error("User not found");
  }

  // If email is being changed, check if it's already taken
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await userRepository.findByEmail(data.email);
    if (emailExists) {
      throw new Error("Email already in use");
    }
  }

  // Hash password if provided
  const updateData: UpdateUserData = { ...data };
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  const user = await userRepository.update(id, updateData);
  return toUserResponse(user);
}

/**
 * Delete user
 */
export async function deleteUser(id: string): Promise<void> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new Error("User not found");
  }

  await userRepository.delete(id);
}
