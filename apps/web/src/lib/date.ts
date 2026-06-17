function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

export function getCalendarWeekdayLabels(language: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(language, {
      timeZone: "UTC",
      weekday: "short"
    }).format(new Date(Date.UTC(2024, 0, 1 + index)))
  );
}

export function getCalendarLeadingEmptyDays(month: string): number {
  const firstDay = parseIsoDate(`${month}-01`).getUTCDay();

  return firstDay === 0 ? 6 : firstDay - 1;
}

export function formatIsoDateForDisplay(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    timeZone: "UTC"
  }).format(parseIsoDate(value));
}

export function formatIsoMonthForDisplay(value: string, language: string): string {
  return new Intl.DateTimeFormat(language, {
    month: "long",
    timeZone: "UTC",
    year: "numeric"
  }).format(parseIsoDate(`${value}-01`));
}
