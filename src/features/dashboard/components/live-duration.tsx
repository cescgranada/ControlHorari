"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration, getDurationMinutes } from "@/lib/utils/time";

type LiveDurationProps = {
  startIso: string;
};

export function LiveDuration({ startIso }: LiveDurationProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const label = useMemo(() => {
    if (!now) return "---";
    return formatDuration(getDurationMinutes(startIso, now));
  }, [now, startIso]);

  return <span suppressHydrationWarning>{label}</span>;
}
