import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/services/auth.service";

type ProtectedLayoutProps = {
  children: React.ReactNode;
};

export default async function ProtectedLayout({
  children
}: ProtectedLayoutProps) {
  const context = await requireUser();

  return (
    <AppShell
      email={context.user.email ?? ""}
      role={context.profile?.role ?? "worker"}
      userName={context.profile?.full_name ?? context.user.email ?? "Usuari"}
    >
      {children}
    </AppShell>
  );
}
