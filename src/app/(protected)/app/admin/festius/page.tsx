import { HolidayManager } from "@/components/holiday-manager";
import { requireRole } from "@/server/services/auth.service";
import { getHolidays } from "@/server/services/holiday.service";
import {
  addHolidayAction,
  deleteHolidayAction
} from "@/features/holidays/actions";

export default async function HolidaysPage() {
  try {
    await requireRole(["admin"]);

    const now = new Date();
    const from = `${now.getFullYear()}-01-01`;
    const to = `${now.getFullYear()}-12-31`;
    const holidays = await getHolidays(from, to);

    return (
      <div className="grid gap-6">
        <HolidayManager
          holidays={holidays}
          onAdd={addHolidayAction}
          onDelete={deleteHolidayAction}
        />
      </div>
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error inesperat en carregar els festius.";
    return (
      <div className="grid gap-6">
        <div className="rounded-md bg-danger-soft p-3 text-sm text-danger">
          {errorMessage}
        </div>
      </div>
    );
  }
}
