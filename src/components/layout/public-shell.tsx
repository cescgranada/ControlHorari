import { Card } from "@/components/ui/card";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <main className="app-noise relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div
        className="absolute inset-x-0 top-0 h-64 bg-hero-grid"
        aria-hidden="true"
      />

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-panel backdrop-blur xl:p-12">
          <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-strong">
            HorariCoop
          </span>

          <div className="mt-6 max-w-xl space-y-4">
            <p className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
              El fitxatge diari, clar i institucional des del primer toc.
            </p>
            <p className="max-w-lg text-base leading-7 text-ink/75 sm:text-lg">
              Base visual per al projecte de control horari de l&apos;escola
              cooperativa. Aquesta shell separa l&apos;espai public de la zona
              operativa privada.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="border-brand/15 bg-white/80">
              <p className="text-sm font-semibold text-ink">Fitxatge rapid</p>
              <p className="mt-2 text-sm text-ink/70">
                Accio principal sempre visible en mobil i desktop.
              </p>
            </Card>
            <Card className="border-success/20 bg-success-soft/70">
              <p className="text-sm font-semibold text-ink">Rols i permisos</p>
              <p className="mt-2 text-sm text-ink/70">
                Estructura preparada per cooperativista, coordinacio i admin.
              </p>
            </Card>
            <Card className="border-pause/20 bg-pause-soft/70">
              <p className="text-sm font-semibold text-ink">Auditoria</p>
              <p className="mt-2 text-sm text-ink/70">
                Model base lligat a Supabase i a la futura traçabilitat legal.
              </p>
            </Card>
          </div>
        </section>

        <section className="flex items-center">{children}</section>
      </div>
    </main>
  );
}
