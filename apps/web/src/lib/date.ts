function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
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
