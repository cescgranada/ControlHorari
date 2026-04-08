import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getServerEnv } from "@/lib/env";
// Temporarily removed Database type to fix build
// import type { Database } from "@/types/database";

export function createClient() {
  const env = getServerEnv();
  const cookieStore = cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        void name;
        void value;
        void options;
        // Read-only helper for server components. Mutation-aware helpers can be added in server actions.
      },
      remove(name: string, options: CookieOptions) {
        void name;
        void options;
        // Read-only helper for server components. Mutation-aware helpers can be added in server actions.
      }
    }
  });
}
