import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "CHF") {
  return new Intl.NumberFormat("de-CH", { style: "currency", currency }).format(value);
}
