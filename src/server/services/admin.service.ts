import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from "@/server/repositories/user.repository";
import type {
  CreateUserInput,
  UpdateUserInput
} from "@/server/repositories/user.repository";

export async function getAdminUsers() {
  return await getAllUsers();
}

export async function createAdminUser(input: CreateUserInput) {
  // Validate input
  if (!input.email || !input.full_name) {
    throw new Error("El correu i el nom són obligatoris");
  }

  // Create user in auth and profile
  const result = await createUser(input);

  // Return only the necessary data (exclude sensitive info)
  return {
    user: result.user,
    temporaryPassword: result.temporaryPassword
  };
}

export async function updateAdminUser(id: string, input: UpdateUserInput) {
  // Validate input
  if (!id) {
    throw new Error("L'identificador és obligatori");
  }

  // Update user
  return await updateUser(id, input);
}

export async function deleteAdminUser(id: string) {
  // Validate input
  if (!id) {
    throw new Error("L'identificador és obligatori");
  }

  // Delete user (soft delete)
  return await deleteUser(id);
}
