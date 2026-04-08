"use server";

import { getReportSnapshot } from "@/server/services/reports.service";
import { requireUser } from "@/server/services/auth.service";

export async function getReportData(
  from: string,
  to: string,
  period: string = "custom"
) {
  const context = await requireUser();

  if (!from || !to) {
    throw new Error("Les dates són obligatòries");
  }

  const validPeriods = ["day", "week", "month", "custom"] as const;
  type ValidPeriod = (typeof validPeriods)[number];
  const isValidPeriod = (p: string): p is ValidPeriod =>
    validPeriods.includes(p as ValidPeriod);

  const snapshot = await getReportSnapshot(context.user.id, {
    from,
    to,
    period: isValidPeriod(period) ? period : "custom"
  });

  return snapshot;
}
