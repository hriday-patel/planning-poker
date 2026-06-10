/**
 * Sort deck values: numeric values in ascending order, then special characters
 */
export function sortDeckValues(values: string[]): string[] {
  const numeric: { value: string; num: number }[] = [];
  const special: string[] = [];

  values.forEach((value) => {
    const num = parseFloat(value);
    if (!isNaN(num) && value.trim() === num.toString()) {
      numeric.push({ value, num });
    } else {
      special.push(value);
    }
  });

  numeric.sort((a, b) => a.num - b.num);

  return [...numeric.map((item) => item.value), ...special];
}

/**
 * Format deck name for display (e.g. generated custom deck IDs → "custom deck")
 */
export function formatDeckName(name: string): string {
  if (name.startsWith("Custom-")) {
    return "custom deck";
  }
  return name;
}

/** Deck name for list/detail labels (e.g. "Fibonacci deck", "custom deck"). */
export function formatDeckLabel(name: string): string {
  const formatted = formatDeckName(name);
  return formatted === "custom deck" ? formatted : `${formatted} deck`;
}
