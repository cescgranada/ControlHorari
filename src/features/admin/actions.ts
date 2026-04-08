"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { getHistoryEntriesForUser } from "@/server/repositories/time-entry.repository";
import { requireRole } from "@/server/services/auth.service";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/constants/navigation";
import { validateTimeEntry } from "@/lib/utils/time-validation";
import { getBreaksForEntries } from "@/server/repositories/break.repository";

export async function updateUserRolesByEmails(
  emails: string[],
  role: "worker" | "admin"
) {
  // Verify the caller is an admin
  await requireRole(["admin"]);

  const env = getServerEnv();
  const cookieStore = cookies();

  // Create a client with service role key if available, otherwise fall back to anon key
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  // First, get the user IDs from auth.users by email
  const { data: users, error: usersError } =
    await supabase.auth.admin.listUsers();
  if (usersError) {
    throw new Error(`Error fetching users: ${usersError.message}`);
  }

  const userIds = users.users
    .filter((user) => emails.includes(user.email || ""))
    .map((user) => user.id);

  if (userIds.length === 0) {
    return {
      success: false,
      message: "No s'han trobat usuaris amb aquests correus electrònics."
    };
  }

  // Update profiles table
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role })
    .in("id", userIds);

  if (updateError) {
    throw new Error(`Error actualitzant rols: ${updateError.message}`);
  }

  return {
    success: true,
    message: `S'han actualitzat ${userIds.length} usuaris a rol '${role}'.`
  };
}

export async function getEntriesForUserAction(
  userId: string,
  fromIso: string,
  toIso: string
) {
  await requireRole(["admin"]);
  const { data, error } = await getHistoryEntriesForUser(
    userId,
    fromIso,
    toIso
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateEntryAction(
  entryId: string,
  clockInIso: string,
  clockOutIso: string | null,
  reason: string
) {
  await requireRole(["admin"]);

  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  // Get the entry to obtain userId for validation
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("user_id")
    .eq("id", entryId)
    .single();

  if (fetchError || !entry) {
    throw new Error("Entrada no trobada.");
  }

  // Validate time entry (exclude current entry from overlap check)
  const validation = await validateTimeEntry(
    entry.user_id,
    clockInIso,
    clockOutIso,
    entryId,
    supabase
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { error } = await supabase
    .from("time_entries")
    .update({
      clock_in: clockInIso,
      clock_out: clockOutIso,
      is_manual: true,
      edited_by: (await supabase.auth.getUser()).data.user?.id,
      edit_reason: reason
    })
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}

export async function createManualEntryForUserAction(
  userId: string,
  clockInIso: string,
  clockOutIso: string | null,
  reason: string
) {
  await requireRole(["admin"]);

  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  // Validate time entry
  const validation = await validateTimeEntry(
    userId,
    clockInIso,
    clockOutIso,
    undefined,
    supabase
  );
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { error } = await supabase.from("time_entries").insert({
    user_id: userId,
    clock_in: clockInIso,
    clock_out: clockOutIso,
    is_manual: true,
    edited_by: (await supabase.auth.getUser()).data.user?.id,
    edit_reason: reason,
    source: "admin"
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}

export async function deleteEntryAction(entryId: string) {
  await requireRole(["admin"]);
  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}

export async function getBreaksForEntryAction(entryId: string) {
  await requireRole(["admin"]);
  const { data, error } = await getBreaksForEntries([entryId]);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateBreakAction(
  breakId: string,
  breakType: "breakfast" | "lunch" | "personal" | "meeting",
  startedAtIso: string,
  endedAtIso: string | null
) {
  await requireRole(["admin"]);
  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  const { error } = await supabase
    .from("breaks")
    .update({
      break_type: breakType,
      started_at: startedAtIso,
      ended_at: endedAtIso
    })
    .eq("id", breakId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}

export async function createBreakForEntryAction(
  entryId: string,
  breakType: "breakfast" | "lunch" | "personal" | "meeting",
  startedAtIso: string,
  endedAtIso: string | null
) {
  await requireRole(["admin"]);
  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  const { error } = await supabase.from("breaks").insert({
    entry_id: entryId,
    break_type: breakType,
    started_at: startedAtIso,
    ended_at: endedAtIso
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}

export async function deleteBreakAction(breakId: string) {
  await requireRole(["admin"]);
  const supabase = createServerClient(
    getServerEnv().NEXT_PUBLIC_SUPABASE_URL,
    getServerEnv().SUPABASE_SERVICE_ROLE_KEY ||
      getServerEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          void name;
          void value;
          void options;
        },
        remove(name: string, options: CookieOptions) {
          void name;
          void options;
        }
      }
    }
  );

  const { error } = await supabase.from("breaks").delete().eq("id", breakId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(routes.adminEntries);
  return { success: true };
}
