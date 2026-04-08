"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/constants/navigation";

import { loginAction } from "@/features/auth/actions";
import { AuthNotice } from "@/features/auth/components/auth-notice";

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="bg-white/92 w-full rounded-[2rem] border-white/80 p-6 shadow-panel sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong/80">
          Accés segur
        </p>
        <h1 className="font-serif text-3xl text-ink">Entra a HorariCoop</h1>
        <p className="text-ink/68 text-sm leading-6">
          Inicia sessió amb el teu correu corporatiu per accedir al fitxatge,
          l&apos;historial i el panell personal.
        </p>
      </div>

      <form className="mt-6 space-y-4" action={loginAction}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nom@escola.cat"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brand"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Contrasenya</span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Mínim 8 caràcters"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 pr-12 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brand"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/50 transition hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto">
            Entrar
          </Button>

          <Link
            href={routes.recoverPassword}
            className="text-sm font-medium text-brand-strong transition hover:text-brand"
          >
            Recuperar contrasenya
          </Link>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        <AuthNotice tone="error" message={error} />
        <AuthNotice message={message} />
      </div>

      <div className="text-ink/62 mt-6 border-t border-line/80 pt-5 text-sm">
        Si t&apos;han convidat al sistema i encara no has definit la teva clau,
        usa l&apos;enllaç del correu o ves a{" "}
        <Link
          href={routes.activateAccount}
          className="font-semibold text-brand-strong hover:text-brand"
        >
          activar compte
        </Link>
        .
      </div>
    </Card>
  );
}
