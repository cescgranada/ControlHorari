import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/constants/navigation";

import { requestPasswordResetAction } from "@/features/auth/actions";
import { AuthNotice } from "@/features/auth/components/auth-notice";

type PasswordResetRequestFormProps = {
  error?: string;
  message?: string;
};

export function PasswordResetRequestForm({
  error,
  message
}: PasswordResetRequestFormProps) {
  return (
    <Card className="bg-white/92 w-full rounded-[2rem] border-white/80 p-6 shadow-panel sm:p-8">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong/80">
          Recuperacio d&apos;accés
        </p>
        <h1 className="font-serif text-3xl text-ink">Restablir contrasenya</h1>
        <p className="text-ink/68 text-sm leading-6">
          Enviarem un enllaç segur al teu correu per definir una nova
          contrasenya.
        </p>
      </div>

      <form className="mt-6 space-y-4" action={requestPasswordResetAction}>
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

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="w-full sm:w-auto">
            Enviar enllac
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
