// Text utilities shared by the letter APIs.

/**
 * Truncate to at most `max` Unicode code points — never splitting a surrogate
 * pair (emoji, some CJK) in half. Plain `String.prototype.slice` counts UTF-16
 * code units, so slicing at a boundary that lands inside a 😀-style pair leaves
 * a lone surrogate that renders as "�". Spreading the string iterates by code
 * point, so `[...str].slice(...)` cuts cleanly.
 */
export function truncateByCodePoints(input: string, max: number): string {
  const points = [...input];
  if (points.length <= max) return input;
  return points.slice(0, max).join("");
}
