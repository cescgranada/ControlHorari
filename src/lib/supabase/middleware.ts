import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { routes } from "@/lib/constants/navigation";
import type { Database } from "@/types/database";

const authEntryPaths: Set<string> = new Set([
  routes.login,
  routes.recoverPassword
]);

function isAuthEntryPath(pathname: string) {
  return authEntryPaths.has(pathname);
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name);
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/app") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = routes.login;
    redirectUrl.searchParams.set("message", "Inicia sessió per accedir a l'aplicació.");

    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthEntryPath(pathname) && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = routes.app;
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
