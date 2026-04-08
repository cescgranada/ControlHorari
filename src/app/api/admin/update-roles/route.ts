import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";
import { updateUserRolesByEmails } from "@/features/admin/actions";

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const cookieStore = cookies();

    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          }
        }
      }
    );

    // Verify user is authenticated and is admin
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "No autoritzat. Has d'iniciar sessió." },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "No autoritzat. Es requereix rol d'administrador." },
        { status: 403 }
      );
    }

    const { emails, role } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Es requereix una llista de correus electrònics." },
        { status: 400 }
      );
    }

    if (!role || (role !== "worker" && role !== "admin")) {
      return NextResponse.json(
        { error: "Rol no vàlid. Ha de ser 'worker' o 'admin'." },
        { status: 400 }
      );
    }

    const result = await updateUserRolesByEmails(emails, role);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error actualitzant rols:", error);
    return NextResponse.json(
      { error: "Error intern del servidor." },
      { status: 500 }
    );
  }
}
