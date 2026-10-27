/**
 * Utility functions for deterministic date and currency formatting across Salamah School.
 * Eliminates SSR vs. Client hydration mismatches by avoiding implicit environment locales.
 */

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const WEEKDAY_NAMES_SHORT = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];

export type DateFormatStyle = "short" | "medium" | "long";

/**
 * Deterministically formats a date string, timestamp, or Date object.
 * - "short": "10/05/2015" (DD/MM/YYYY)
 * - "medium": "10 May 2015"
 * - "long": "Tue, 10 May 2015"
 */
export function formatDate(
  input: string | Date | number | null | undefined,
  style: DateFormatStyle = "short"
): string {
  if (!input) return "";

  // Handle SQL DATE string format: "YYYY-MM-DD"
  if (typeof input === "string") {
    const sqlDateMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (sqlDateMatch) {
      const year = parseInt(sqlDateMatch[1], 10);
      const month = parseInt(sqlDateMatch[2], 10); // 1-12
      const day = parseInt(sqlDateMatch[3], 10); // 1-31

      const dayStr = String(day).padStart(2, "0");
      const monthStr = String(month).padStart(2, "0");

      if (style === "short") {
        return `${dayStr}/${monthStr}/${year}`;
      }

      const monthName = MONTH_NAMES_SHORT[month - 1] || monthStr;

      if (style === "medium") {
        return `${dayStr} ${monthName} ${year}`;
      }

      // "long": calculate weekday
      const d = new Date(Date.UTC(year, month - 1, day));
      const weekday = WEEKDAY_NAMES_SHORT[d.getUTCDay()] || "";
      return `${weekday}, ${dayStr} ${monthName} ${year}`;
    }
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) return "";

  // Use UTC to ensure absolute consistency across timezones and SSR
  const day = String(d.getUTCDate()).padStart(2, "0");
  const monthIdx = d.getUTCMonth();
  const month = String(monthIdx + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  if (style === "short") {
    return `${day}/${month}/${year}`;
  }

  const monthName = MONTH_NAMES_SHORT[monthIdx] || month;

  if (style === "medium") {
    return `${day} ${monthName} ${year}`;
  }

  const weekday = WEEKDAY_NAMES_SHORT[d.getUTCDay()] || "";
  return `${weekday}, ${day} ${monthName} ${year}`;
}

/**
 * Deterministically formats a date and time string.
 * Example: "20 Oct 2026, 12:00"
 */
export function formatDateTime(input: string | Date | number | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getUTCDate()).padStart(2, "0");
  const monthName = MONTH_NAMES_SHORT[d.getUTCMonth()] || "";
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");

  return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
}

/**
 * Formats numbers into locale-consistent comma-separated currency values.
 */
export function formatNaira(amountNaira: number | string | null | undefined): string {
  const num = typeof amountNaira === "number" ? amountNaira : Number(amountNaira || 0);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}
