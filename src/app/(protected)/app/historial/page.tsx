import { HistoryScreen } from "@/features/history/components/history-screen";
import { requireUser } from "@/server/services/auth.service";
import { getHistorySnapshot } from "@/server/services/history.service";
import { getAllUsers } from "@/server/repositories/user.repository";

type HistoryPageProps = {
  searchParams?: {
    from?: string | string[];
    to?: string | string[];
    userId?: string | string[];
  };
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  try {
    const context = await requireUser();
    const isAdmin = context.profile?.role === "admin";
    const currentUserId = context.user.id;

    const userIdParam = searchParams?.userId
      ? Array.isArray(searchParams.userId)
        ? searchParams.userId[0]
        : searchParams.userId
      : null;

    const targetUserId = isAdmin && userIdParam ? userIdParam : currentUserId;

    let users: Array<{ id: string; full_name: string; email: string }> = [];
    if (isAdmin) {
      const allUsers = await getAllUsers();
      users = (Array.isArray(allUsers) ? allUsers : []).map(
        (u: { id: string; full_name: string; email: string }) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email
        })
      );
    }

    const snapshot = await getHistorySnapshot(targetUserId, searchParams);

    return (
      <HistoryScreen
        snapshot={snapshot}
        isAdmin={isAdmin}
        users={users}
        selectedUserId={targetUserId}
      />
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar l'històric.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
