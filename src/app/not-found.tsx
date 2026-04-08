import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pàgina no trobada · HorariCoop",
  description: "La pàgina que busques no existeix."
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="select-none text-7xl font-bold text-brand/20">404</p>
        <h1 className="mt-4 font-serif text-3xl text-ink">Pàgina no trobada</h1>
        <p className="mt-3 text-sm leading-7 text-ink/65">
          La pàgina que cerques no existeix o ha estat moguda. Comprova
          l&apos;adreça o torna a l&apos;inici.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            Tornar a l&apos;inici
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist"
          >
            Iniciar sessió
          </Link>
        </div>
      </div>
    </div>
  );
}
