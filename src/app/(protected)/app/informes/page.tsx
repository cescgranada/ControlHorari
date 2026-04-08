import { ReportsScreen } from "@/features/reports/components/reports-screen";
import { requireUser } from "@/server/services/auth.service";
import {
  getReportSnapshot,
  getReportSnapshotsPerUser
} from "@/server/services/reports.service";
import { getAllUsers } from "@/server/repositories/user.repository";

type ReportsPageProps = {
  searchParams?: {
    from?: string | string[];
    to?: string | string[];
    period?: string;
    userId?: string | string[];
  };
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  try {
    let context;
    try {
      context = await requireUser();
    } catch (authError) {
      const authErrorMessage =
        authError instanceof Error
          ? `Error d'autenticació: ${authError.message}`
          : "Error inesperat en verificar l'autenticació.";
      return (
        <div className="grid gap-6">
          <div className="whitespace-pre-wrap rounded-md bg-danger-soft p-3 text-sm text-danger">
            {authErrorMessage}
          </div>
        </div>
      );
    }

    const isAdmin = context.profile?.role === "admin";
    const currentUserId = context.user.id;

    const userIdParams = searchParams?.userId
      ? Array.isArray(searchParams.userId)
        ? searchParams.userId
        : [searchParams.userId]
      : [];

    let users: Array<{ id: string; full_name: string; email: string }> = [];
    if (isAdmin) {
      const result = await getAllUsers();
      const allUsers = Array.isArray(result.data) ? result.data : [];
      users = allUsers
        .filter((u) => u.is_active && u.role === "worker")
        .map((u) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email
        }));
    }

    const selectedUserIds =
      isAdmin && userIdParams.length > 0
        ? userIdParams
        : isAdmin
          ? users.map((u) => u.id)
          : [currentUserId];

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const from = searchParams?.from
      ? Array.isArray(searchParams.from)
        ? searchParams.from[0]
        : searchParams.from
      : firstDayOfMonth.toISOString().split("T")[0];

    const to = searchParams?.to
      ? Array.isArray(searchParams.to)
        ? searchParams.to[0]
        : searchParams.to
      : lastDayOfMonth.toISOString().split("T")[0];

    const period = searchParams?.period ?? "month";

    const validPeriods = ["day", "week", "month", "custom"] as const;
    type ValidPeriod = (typeof validPeriods)[number];
    const isValidPeriod = (p: string): p is ValidPeriod =>
      validPeriods.includes(p as ValidPeriod);

    const filters = {
      from,
      to,
      period: isValidPeriod(period) ? period : "month"
    };

    const usePerUser = isAdmin && users.length > 0;

    if (usePerUser) {
      const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
      const userSnapshots = await getReportSnapshotsPerUser(
        selectedUsers,
        filters
      );
      try {
        return (
          <ReportsScreen
            isAdmin={isAdmin}
            users={users}
            selectedUserIds={selectedUserIds}
            snapshot={
              userSnapshots[0]?.snapshot ?? {
                filters,
                days: [],
                totals: {
                  days: 0,
                  workedMinutes: 0,
                  breakMinutes: 0,
                  netMinutes: 0,
                  entries: 0,
                  avgNetMinutesPerDay: 0
                }
              }
            }
            userSnapshots={userSnapshots}
          />
        );
      } catch (renderError) {
        const renderErrorMessage =
          renderError instanceof Error
            ? `Error renderitzant informes: ${renderError.message}\n${renderError.stack}`
            : "Error inesperat en renderitzar els informes.";
        return (
          <div className="grid gap-6">
            <div className="whitespace-pre-wrap rounded-md bg-danger-soft p-3 text-sm text-danger">
              {renderErrorMessage}
            </div>
          </div>
        );
      }
    }

    const snapshot = await getReportSnapshot(currentUserId, filters);

    try {
      return (
        <ReportsScreen
          snapshot={snapshot}
          isAdmin={isAdmin}
          users={users}
          selectedUserIds={[currentUserId]}
          userSnapshots={[
            {
              userId: currentUserId,
              userName: context.user.email ?? "Usuari",
              snapshot
            }
          ]}
        />
      );
    } catch (renderError) {
      const renderErrorMessage =
        renderError instanceof Error
          ? `Error renderitzant informes: ${renderError.message}\n${renderError.stack}`
          : "Error inesperat en renderitzar els informes.";
      return (
        <div className="grid gap-6">
          <div className="whitespace-pre-wrap rounded-md bg-danger-soft p-3 text-sm text-danger">
            {renderErrorMessage}
          </div>
        </div>
      );
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `${error.message}\n${error.stack}`
        : "Error inesperat en carregar els informes.";
    return (
      <div className="grid gap-6">
        <div className="whitespace-pre-wrap rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
