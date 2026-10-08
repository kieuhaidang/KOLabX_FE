/**
 * Formats a string or number to a standard thousands-separated string (vi-VN locale, using dot separator).
 */
export function formatThousands(val: string | number): string {
  if (val === undefined || val === null) return "";
  const numStr = String(val).replace(/\D/g, "");
  if (!numStr) return "";
  return new Intl.NumberFormat("vi-VN").format(parseInt(numStr, 10));
}

/**
 * Parses a thousands-separated string back to a raw integer.
 */
export function parseThousands(val: string): number {
  if (!val) return 0;
  const numStr = val.replace(/\D/g, "");
  return numStr ? parseInt(numStr, 10) : 0;
}
