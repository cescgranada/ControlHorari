import { AdminEntriesScreen } from "@/features/admin/components/admin-entries-screen";
import { requireRole } from "@/server/services/auth.service";
import { getAdminUsers } from "@/server/services/admin.service";

export default async function AdminEntriesPage() {
  try {
    await requireRole(["admin"]);

    const { data: users } = await getAdminUsers();

    return <AdminEntriesScreen users={users ?? []} />;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar la pàgina d'entrades.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
