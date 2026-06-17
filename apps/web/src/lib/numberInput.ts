export function parseIntegerInput(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : null;
}

export function isNumberInRange(
  value: number | null,
  range: { min: number; max: number }
): value is number {
  return value !== null && value >= range.min && value <= range.max;
}
