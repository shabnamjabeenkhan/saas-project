import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency value to GBP string.
 * @param amount - Amount in major currency units (e.g., 89.50 for £89.50)
 * @param currencyCode - Currency code (default: "GBP")
 * @returns Formatted currency string (e.g., "£89.50")
 */
export function formatCurrency(amount: number, currencyCode: string = "GBP"): string {
  const symbol = currencyCode === "GBP" ? "£" : currencyCode === "USD" ? "$" : "";
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Format percentage value.
 * @param value - Percentage value (e.g., 340 for 340%)
 * @returns Formatted percentage string (e.g., "340%")
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}
