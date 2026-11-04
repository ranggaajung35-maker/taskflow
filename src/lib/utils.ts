import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function initials(name?: string | null) {
  if (!name?.trim()) return "TF";
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function formatDate(value?: string | null, pattern = "d MMM yyyy") {
  if (!value) return "Tanpa tenggat";
  try { return format(parseISO(value), pattern, { locale: id }); } catch { return "Tanggal tidak valid"; }
}

export function relativeDate(value?: string | null) {
  if (!value) return "Tanpa tenggat";
  try { return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: id }); } catch { return ""; }
}

export function dueLabel(value?: string | null) {
  if (!value) return "Tanpa tenggat";
  const date = parseISO(value);
  if (isPast(date) && format(date, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")) return "Terlambat";
  return formatDate(value, "d MMM");
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

export function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}
