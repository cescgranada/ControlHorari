import { TeamDashboard } from "@/features/team/components/team-dashboard";
import { requireRole } from "@/server/services/auth.service";
import { getTeamStatus } from "@/server/services/team.service";

export default async function TeamPage() {
  try {
    await requireRole(["admin"]);

    const members = await getTeamStatus();

    return <TeamDashboard members={members} />;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar l'equip.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
