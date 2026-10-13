import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FormField } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function calculateCompletion(
  fields: FormField[],
  answers: Record<string, unknown>
): number {
  const required = fields.filter((f) => f.required);
  if (required.length === 0) return 100;

  const filled = required.filter((f) => {
    const val = answers[f.name];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  return Math.round((filled.length / required.length) * 100);
}

export function getFieldIcon(type: string): string {
  const icons: Record<string, string> = {
    TEXT: "Type",
    EMAIL: "Mail",
    TEL: "Phone",
    NUMBER: "Hash",
    DATE: "Calendar",
    TEXTAREA: "AlignLeft",
    SELECT: "ChevronDown",
    CHECKBOX: "CheckSquare",
    RADIO: "Circle",
  };
  return icons[type] || "Type";
}

export function truncate(str: string, length: number = 80): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
