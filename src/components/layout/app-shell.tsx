"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { appNavigation } from "@/lib/constants/navigation";
import { routes } from "@/lib/constants/navigation";
import { logoutAction } from "@/features/auth/actions";
import type { AppRole } from "@/types/domain";

type AppShellProps = {
  children: React.ReactNode;
  email: string;
  role: AppRole;
  userName: string;
};

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === routes.app) {
    return {
      title: "Inici",
      subtitle: "Estat de la jornada i accions principals"
    };
  }
  if (pathname === routes.history) {
    return {
      title: "Historial",
      subtitle: "Consulta de jornades i incidències"
    };
  }
  if (pathname === routes.reports) {
    return { title: "Informes", subtitle: "Resums i exportacions" };
  }
  if (pathname === routes.profile) {
    return { title: "Perfil", subtitle: "Dades personals i preferències" };
  }
  if (pathname.startsWith(routes.adminUsers)) {
    return { title: "Administració", subtitle: "Gestió d'usuaris" };
  }
  if (pathname.startsWith(routes.adminEntries)) {
    return { title: "Entrades", subtitle: "Correcció manual d'entrades" };
  }
  if (pathname.startsWith("/app/historial/editar")) {
    return { title: "Editar entrada", subtitle: "Modificació de registre" };
  }
  if (pathname === routes.adminHolidays) {
    return { title: "Festius", subtitle: "Calendari de festius i tancaments" };
  }
  return { title: "HorariCoop", subtitle: "Control horari" };
}

export function AppShell({ children, email, role, userName }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageInfo = getPageTitle(pathname);
  const isAdmin = role === "admin";

  const mainNavItems = isAdmin
    ? appNavigation.filter((item) => item.href !== routes.history)
    : appNavigation;

  const privilegedLinks = [
    isAdmin
      ? {
          label: "Admin",
          href: routes.adminUsers,
          description: "Usuaris i gestió global"
        }
      : null,
    isAdmin
      ? {
          label: "Entrades",
          href: routes.adminEntries,
          description: "Correcció manual d'entrades"
        }
      : null,
    isAdmin
      ? {
          label: "Festius",
          href: routes.adminHolidays,
          description: "Calendari de festius i tancaments"
        }
      : null
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    description: string;
  }>;

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  const isActive = (href: string) => {
    if (href === routes.app) {
      return pathname === routes.app;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-serif text-2xl text-ink">HorariCoop</p>
          <p className="mt-1 text-sm text-ink/65">
            Control diari i gestió interna
          </p>
        </div>
        <Button
          variant="ghost"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Button>
      </div>

      <nav className="mt-6 grid gap-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              isActive(item.href)
                ? "border-brand/20 bg-brand-soft/70 text-ink"
                : "border-transparent text-ink/70 hover:border-brand/15 hover:bg-brand-soft/70 hover:text-ink"
            }`}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-1 block text-xs text-ink/55">
              {item.description}
            </span>
          </Link>
        ))}
      </nav>

      {privilegedLinks.length > 0 ? (
        <div className="mt-6 border-t border-line/80 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong/75">
            Accessos per rol
          </p>
          <div className="mt-3 grid gap-2">
            {privilegedLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "border-brand/20 bg-brand-soft/70 text-ink"
                    : "border-transparent text-ink/70 hover:border-brand/15 hover:bg-brand-soft/70 hover:text-ink"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-ink/55">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 border-t border-line/80 pt-6">
        <div className="rounded-[1.5rem] border border-brand/15 bg-brand-soft/70 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/75">
            Sessió
          </p>
          <p className="mt-2 text-base font-semibold text-ink">{userName}</p>
          <p className="mt-1 text-sm text-ink/65">{email}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-brand-strong/75">
            {role}
          </p>
        </div>

        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
          >
            Tancar sessió
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-transparent px-4 py-4 sm:px-6 lg:px-8">
      {/* Mobile header */}
      <header className="mb-4 flex items-center justify-between rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-panel backdrop-blur lg:hidden">
        <div>
          <p className="font-serif text-xl text-ink">HorariCoop</p>
        </div>
        <Button variant="secondary" onClick={() => setSidebarOpen(true)}>
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
            className="mr-2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          Menú
        </Button>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform rounded-r-[1.75rem] border border-white/70 bg-white/95 p-5 shadow-panel backdrop-blur transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop layout */}
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 lg:flex-row">
        <aside className="hidden rounded-[1.75rem] border border-white/70 bg-white/85 p-5 shadow-panel backdrop-blur lg:block lg:w-72 lg:p-6">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div>
              <p className="font-serif text-2xl text-ink">HorariCoop</p>
              <p className="mt-1 text-sm text-ink/65">
                Control diari i gestió interna
              </p>
            </div>
          </div>

          <nav className="mt-6 grid gap-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "border-brand/20 bg-brand-soft/70 text-ink"
                    : "border-transparent text-ink/70 hover:border-brand/15 hover:bg-brand-soft/70 hover:text-ink"
                }`}
              >
                <span className="block text-sm font-semibold">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-ink/55">
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>

          {privilegedLinks.length > 0 ? (
            <div className="mt-6 border-t border-line/80 pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-strong/75">
                Accessos per rol
              </p>
              <div className="mt-3 grid gap-2">
                {privilegedLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      isActive(item.href)
                        ? "border-brand/20 bg-brand-soft/70 text-ink"
                        : "border-transparent text-ink/70 hover:border-brand/15 hover:bg-brand-soft/70 hover:text-ink"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-ink/55">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-line/80 pt-6">
            <div className="rounded-[1.5rem] border border-brand/15 bg-brand-soft/70 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-strong/75">
                Sessió
              </p>
              <p className="mt-2 text-base font-semibold text-ink">
                {userName}
              </p>
              <p className="mt-1 text-sm text-ink/65">{email}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-brand-strong/75">
                {role}
              </p>
            </div>

            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
              >
                Tancar sessió
              </button>
            </form>
          </div>
        </aside>

        <div className="flex-1 rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-panel backdrop-blur lg:p-8">
          <header className="hidden border-b border-line/80 pb-5 sm:block">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong/75">
                HorariCoop
              </p>
              <h1 className="mt-2 font-serif text-3xl text-ink">
                {pageInfo.title}
              </h1>
              <p className="mt-1 text-sm text-ink/60">{pageInfo.subtitle}</p>
            </div>
          </header>

          <div className="pt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
