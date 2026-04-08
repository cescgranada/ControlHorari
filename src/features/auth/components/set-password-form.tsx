import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/constants/navigation";

import { updatePasswordAction } from "@/features/auth/actions";
import { AuthNotice } from "@/features/auth/components/auth-notice";

type SetPasswordFormProps = {
  title: string;
  description: string;
  targetRoute: string;
  error?: string;
  message?: string;
};

export function SetPasswordForm({
  title,
  description,
  targetRoute,
  error,
  message
}: SetPasswordFormProps) {
  return (
    <Card className="bg-white/92 w-full rounded-[2rem] border-white/80 p-6 shadow-panel sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong/80">
          Credencials d&apos;accés
        </p>
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        <p className="text-ink/68 text-sm leading-6">{description}</p>
      </div>

      <form className="mt-6 space-y-4" action={updatePasswordAction}>
        <input type="hidden" name="targetRoute" value={targetRoute} />

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">
            Nova contrasenya
          </span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minim 8 caracters"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brand"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">
            Confirma contrasenya
          </span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repeteix la nova contrasenya"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brand"
            required
          />
        </label>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto">
            Desar contrasenya
          </Button>

          <Link
            href={routes.login}
            className="text-sm font-medium text-brand-strong transition hover:text-brand"
          >
            Tornar al login
          </Link>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        <AuthNotice tone="error" message={error} />
        <AuthNotice message={message} />
      </div>
    </Card>
  );
}
