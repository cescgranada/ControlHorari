const APP_TIME_ZONE = "Europe/Madrid";

function getFormatter(
  options: Intl.DateTimeFormatOptions,
  locale = "ca-ES",
  timeZone = APP_TIME_ZONE
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options
  });
}

export function getDateKey(value: Date | string, timeZone = APP_TIME_ZONE) {
  const date = typeof value === "string" ? new Date(value) : value;

  return getFormatter(
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    },
    "en-CA",
    timeZone
  ).format(date);
}

export function formatTime(
  value: Date | string | null,
  timeZone = APP_TIME_ZONE
) {
  if (!value) {
    return "--";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  return getFormatter(
    {
      hour: "2-digit",
      minute: "2-digit"
    },
    "ca-ES",
    timeZone
  ).format(date);
}

export function formatDateLabel(
  value: Date | string,
  timeZone = APP_TIME_ZONE
) {
  const date = typeof value === "string" ? new Date(value) : value;

  return getFormatter(
    {
      weekday: "short",
      day: "2-digit",
      month: "short"
    },
    "ca-ES",
    timeZone
  ).format(date);
}

export function formatFullDateLabel(
  value: Date | string,
  timeZone = APP_TIME_ZONE
) {
  const date = typeof value === "string" ? new Date(value) : value;

  return getFormatter(
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    },
    "ca-ES",
    timeZone
  ).format(date);
}

export function getDurationMinutes(start: Date | string, end: Date | string) {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  return Math.max(
    0,
    Math.round((endDate.getTime() - startDate.getTime()) / 60000)
  );
}

export function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0m";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function getCurrentWeekDays(reference = new Date(), length = 5) {
  const base = new Date(reference);
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + diff);

  return Array.from({ length }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);

    return date;
  });
}

export function shiftDays(reference: Date, days: number) {
  const date = new Date(reference);
  date.setDate(date.getDate() + days);
  return date;
}

export function toDateInputValue(value: Date | string) {
  return getDateKey(value, APP_TIME_ZONE);
}

export { APP_TIME_ZONE };
