"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDuration, getDurationMinutes } from "@/lib/utils/time";

type LiveDurationProps = {
  startIso: string;
};

type LiveNetDurationProps = {
  clockInIso: string;
  accumulatedBreakMinutes: number;
  activePauseStartIso?: string;
};

export function LiveNetDuration({
  clockInIso,
  accumulatedBreakMinutes,
  activePauseStartIso
}: LiveNetDurationProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  const label = useMemo(() => {
    if (!now) return "---";
    const grossMinutes = getDurationMinutes(clockInIso, now);
    const pauseMinutes =
      accumulatedBreakMinutes +
      (activePauseStartIso
        ? getDurationMinutes(activePauseStartIso, now.toISOString())
        : 0);
    return formatDuration(Math.max(0, grossMinutes - pauseMinutes));
  }, [now, clockInIso, accumulatedBreakMinutes, activePauseStartIso]);

  return <span suppressHydrationWarning>{label}</span>;
}

export function LiveDuration({ startIso }: LiveDurationProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const label = useMemo(() => {
    if (!now) return "---";
    return formatDuration(getDurationMinutes(startIso, now));
  }, [now, startIso]);

  return <span suppressHydrationWarning>{label}</span>;
}
