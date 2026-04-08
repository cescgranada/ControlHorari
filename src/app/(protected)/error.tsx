"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ProtectedError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <svg
            className="h-7 w-7 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="font-serif text-2xl text-ink">Error en carregar</h2>
        <p className="mt-3 text-sm leading-7 text-ink/65">
          No s&apos;ha pogut carregar aquesta secció. Pots intentar-ho de nou o
          tornar al tauler principal.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-ink/40">
            Ref: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            Tornar a intentar
          </button>
          <a
            href="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line bg-white px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist"
          >
            Tauler principal
          </a>
        </div>
      </div>
    </div>
  );
}
