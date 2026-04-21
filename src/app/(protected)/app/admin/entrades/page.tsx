import { AdminEntriesScreen } from "@/features/admin/components/admin-entries-screen";
import { requireRole } from "@/server/services/auth.service";
import { getAdminUsers } from "@/server/services/admin.service";
import { isRedirectError } from "next/dist/client/components/redirect";

export default async function AdminEntriesPage() {
  try {
    await requireRole(["admin"]);

    const result = await getAdminUsers();
    
    if (result.error) {
      throw new Error(result.error.message);
    }

    return <AdminEntriesScreen users={result.data ?? []} />;
  } catch (error) {
    // IMPORTANT: Si l'error és una redirecció de Next.js, l'hem de tornar a llançar
    // perquè Next.js la pugui gestionar. Si no, peta en producció.
    if (isRedirectError(error)) {
      throw error;
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar la pàgina d'entrades.";
        
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          <strong>Error de servidor:</strong> {errorMessage}
        </div>
      </div>
    );
  }
}
