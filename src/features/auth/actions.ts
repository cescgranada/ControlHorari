"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSiteUrl, hasSupabaseEnv } from "@/lib/env";
import { routes } from "@/lib/constants/navigation";
import { createSupabaseActionClient } from "@/lib/supabase/action";
import {
  loginSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema
} from "@/lib/validations/auth";

function buildRedirect(pathname: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

function getOriginFromHeaders() {
  const headerStore = headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (origin) {
    return origin;
  }

  if (host) {
    return `${forwardedProto ?? "http"}://${host}`;
  }

  return undefined;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    redirect(
      buildRedirect(routes.login, {
        error: parsed.error.issues[0]?.message ?? "Revisa les dades d'accés."
      })
    );
  }

  if (!hasSupabaseEnv()) {
    redirect(
      buildRedirect(routes.login, {
        error:
          "Falten les variables de Supabase. Configura `.env.local` abans d'iniciar sessió."
      })
    );
  }

  const supabase = createSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(buildRedirect(routes.login, { error: error.message }));
  }

  redirect(
    buildRedirect(routes.app, { message: "Sessió iniciada correctament." })
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({
    email: String(formData.get("email") ?? "")
  });

  if (!parsed.success) {
    redirect(
      buildRedirect(routes.recoverPassword, {
        error: parsed.error.issues[0]?.message ?? "Revisa l'email introduït."
      })
    );
  }

  if (!hasSupabaseEnv()) {
    redirect(
      buildRedirect(routes.recoverPassword, {
        error:
          "Falten les variables de Supabase. Configura `.env.local` abans d'usar aquest flux."
      })
    );
  }

  const supabase = createSupabaseActionClient();
  const baseUrl = getSiteUrl(getOriginFromHeaders());
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(routes.resetPassword)}`;

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo
    }
  );

  if (error) {
    redirect(buildRedirect(routes.recoverPassword, { error: error.message }));
  }

  redirect(
    buildRedirect(routes.recoverPassword, {
      message:
        "Si el correu existeix, rebràs un enllaç per restablir la contrasenya."
    })
  );
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = passwordUpdateSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? "")
  });

  const targetRoute = String(
    formData.get("targetRoute") ?? routes.resetPassword
  );

  if (!parsed.success) {
    redirect(
      buildRedirect(targetRoute, {
        error:
          parsed.error.issues[0]?.message ??
          "No s'ha pogut actualitzar la contrasenya."
      })
    );
  }

  if (!hasSupabaseEnv()) {
    redirect(
      buildRedirect(targetRoute, {
        error:
          "Falten les variables de Supabase. Configura `.env.local` abans d'usar aquest flux."
      })
    );
  }

  const supabase = createSupabaseActionClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    redirect(buildRedirect(targetRoute, { error: error.message }));
  }

  redirect(
    buildRedirect(routes.login, {
      message:
        "Contrasenya actualitzada. Ja pots iniciar sessió amb la nova clau."
    })
  );
}

export async function logoutAction() {
  if (hasSupabaseEnv()) {
    const supabase = createSupabaseActionClient();
    await supabase.auth.signOut();
  }

  redirect(
    buildRedirect(routes.login, { message: "Sessió tancada correctament." })
  );
}
