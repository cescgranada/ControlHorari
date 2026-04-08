"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from "@/server/services/admin.service";
import type {
  CreateUserInput,
  UpdateUserInput
} from "@/server/repositories/user.repository";

export async function createUserAction(input: CreateUserInput) {
  try {
    const result = await createAdminUser(input);
    revalidatePath("/app/admin/usuaris");
    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error creating user";
    return { success: false, error: message };
  }
}

export async function updateUserAction(id: string, input: UpdateUserInput) {
  try {
    await updateAdminUser(id, input);
    revalidatePath("/app/admin/usuaris");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error updating user";
    return { success: false, error: message };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await deleteAdminUser(id);
    revalidatePath("/app/admin/usuaris");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error deleting user";
    return { success: false, error: message };
  }
}
