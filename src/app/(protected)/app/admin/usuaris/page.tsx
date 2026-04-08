import { AdminUsersScreen } from "@/features/admin/components/admin-users-screen";
import { requireRole } from "@/server/services/auth.service";
import { getAdminUsers } from "@/server/services/admin.service";
import { getPendingAbsences } from "@/server/services/team.service";

export default async function AdminUsersPage() {
  try {
    await requireRole(["admin"]);

    const { data: users } = await getAdminUsers();
    const pendingAbsences = await getPendingAbsences();

    return (
      <AdminUsersScreen users={users ?? []} pendingAbsences={pendingAbsences} />
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar la pàgina d'usuaris.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
