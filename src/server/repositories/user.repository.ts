import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UserListItem = {
  id: string;
  email: string;
  full_name: string;
  role: "worker" | "admin";
  department: string | null;
  weekly_hours: number;
  is_active: boolean;
  created_at: string;
};

export type CreateUserInput = {
  email: string;
  full_name: string;
  role: "worker" | "admin";
  department?: string | null;
  weekly_hours?: number;
  password?: string;
};

export type UpdateUserInput = {
  full_name?: string;
  role?: "worker" | "admin";
  department?: string | null;
  weekly_hours?: number;
  is_active?: boolean;
};

export async function getAllUsers() {
  const supabase = createClient();
  const admin = createSupabaseAdminClient();

  const result = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, department, weekly_hours, is_active, created_at"
    )
    .order("full_name", { ascending: true });

  // Cast the data to the correct type
  const data = result.data as ProfileRow[] | null;

  // Get all auth users to map emails
  const { data: authUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  const emailMap = new Map<string, string>();
  if (authUsers?.users) {
    authUsers.users.forEach((user) => {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    });
  }

  const users: UserListItem[] = (data ?? []).map((profile) => ({
    id: profile.id,
    email: emailMap.get(profile.id) ?? "",
    full_name: profile.full_name,
    role: profile.role,
    department: profile.department,
    weekly_hours: profile.weekly_hours,
    is_active: profile.is_active,
    created_at: profile.created_at
  }));

  return {
    ...result,
    data: users
  };
}

export async function getUserById(id: string) {
  const supabase = createClient();

  const result = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, department, weekly_hours, is_active, created_at"
    )
    .eq("id", id)
    .single();

  return {
    ...result,
    data: result.data as UserListItem | null
  };
}

export async function createUser(input: CreateUserInput) {
  const supabase = createClient();
  const admin = createSupabaseAdminClient();

  // Generate a temporary password if not provided
  const tempPassword = input.password || generateTemporaryPassword();

  // Create user in Supabase Auth
  const { data: authData, error: authError } =
    await admin.auth.admin.createUser({
      email: input.email,
      password: tempPassword,
      email_confirm: true, // Skip email confirmation for admin-created users
      user_metadata: {
        full_name: input.full_name
      }
    });

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Failed to create user in auth");
  }

  const userId = authData.user.id;

  // The trigger will create a default profile. Now we update it with the desired role and other fields.
  const updateData: ProfileUpdate = {
    role: input.role,
    department: input.department ?? null,
    weekly_hours: input.weekly_hours ?? 30.0,
    is_active: true
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    // If profile update fails, delete the auth user to clean up
    await admin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  // Return created user with temporary password
  return {
    user: authData.user,
    temporaryPassword: tempPassword
  };
}

function generateTemporaryPassword(): string {
  // Generate a cryptographically secure temporary password
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  let password = "";
  for (let i = 0; i < array.length; i++) {
    password += chars.charAt(array[i] % chars.length);
  }
  return password;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const supabase = createClient();

  const updateData: ProfileUpdate = {
    ...input
  };

  const result = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  return result;
}

export async function deleteUser(id: string) {
  const supabase = createClient();

  // Instead of deleting, we'll deactivate
  const updateData: ProfileUpdate = { is_active: false };

  const result = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  return result;
}
