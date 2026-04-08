import { DashboardScreen } from "@/features/dashboard/components/dashboard-screen";
import { requireUser } from "@/server/services/auth.service";
import { getDashboardSnapshot } from "@/server/services/dashboard.service";

type AppPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default async function AppPage({ searchParams }: AppPageProps) {
  try {
    const context = await requireUser();
    const snapshot = await getDashboardSnapshot(context.user.id);

    return (
      <DashboardScreen
        snapshot={snapshot}
        userName={context.profile?.full_name ?? context.user.email ?? "Usuari"}
        userRole={context.profile?.role ?? "worker"}
        error={searchParams?.error}
        message={searchParams?.message}
      />
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar el tauler.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
