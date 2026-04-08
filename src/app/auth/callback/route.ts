import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import { routes } from "@/lib/constants/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || routes.app;
  const nextUrl = new URL(next, url.origin);

  if (!hasSupabaseEnv()) {
    nextUrl.pathname = routes.login;
    nextUrl.searchParams.set(
      "error",
      "Falten les variables de Supabase per completar l'autenticació."
    );

    return NextResponse.redirect(nextUrl);
  }

  if (code) {
    const supabase = createSupabaseActionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      nextUrl.pathname = routes.login;
      nextUrl.searchParams.set("error", error.message);
    }
  }

  return NextResponse.redirect(nextUrl);
}
