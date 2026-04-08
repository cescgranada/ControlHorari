import { cache } from "react";

import { redirect } from "next/navigation";

import { routes } from "@/lib/constants/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getNotificationPreferencesByUserId } from "@/server/repositories/notification-preferences.repository";
import { getProfileById } from "@/server/repositories/profile.repository";
import type { Database } from "@/types/database";
import type { AppRole } from "@/types/domain";

export const getCurrentUserContext = cache(async () => {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const [{ data: profileData }, { data: preferencesData }] = await Promise.all([
    getProfileById(user.id),
    getNotificationPreferencesByUserId(user.id)
  ]);

  const profile =
    (profileData as Database["public"]["Tables"]["profiles"]["Row"] | null) ??
    null;
  const preferences =
    (preferencesData as
      | Database["public"]["Tables"]["user_notification_preferences"]["Row"]
      | null) ?? null;

  return {
    user,
    profile,
    preferences
  };
});

export async function requireUser() {
  const context = await getCurrentUserContext();

  if (!context?.user) {
    redirect(routes.login);
  }

  return context;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const context = await requireUser();
  const role = context.profile?.role;

  if (!role || !allowedRoles.includes(role)) {
    redirect(routes.app);
  }

  return context;
}
