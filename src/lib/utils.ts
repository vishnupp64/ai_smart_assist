import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FormField } from "@/types";

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert a string to a URL-safe slug
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Truncate a string to a max length with ellipsis
export function truncate(str: string, maxLength: number = 60): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

// Format a date to a human-readable long format (e.g., "Oct 13, 2026, 11:59 PM")
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format a date to a short format (e.g., "Oct 13, 2026")
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Relative time (e.g., "2 hours ago")
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateShort(d);
}

// Calculate form completion percentage based on required fields filled
export function calculateCompletion(
  fields: FormField[],
  values: Record<string, unknown>
): number {
  const requiredFields = fields.filter((f) => f.required);
  if (requiredFields.length === 0) {
    // If no required fields, base on all fields filled
    const allFilled = fields.filter((f) => {
      const val = values[f.name];
      return val !== undefined && val !== "" && val !== null && val !== false;
    });
    return fields.length > 0
      ? Math.round((allFilled.length / fields.length) * 100)
      : 100;
  }

  const filled = requiredFields.filter((f) => {
    const val = values[f.name];
    if (val === undefined || val === null || val === "") return false;
    if (typeof val === "boolean") return val; // checkboxes: must be true to count
    if (typeof val === "string") return val.trim().length > 0;
    return true;
  });

  return Math.round((filled.length / requiredFields.length) * 100);
}

// Generate a random color class for categories
export function getCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    General: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    Support: "from-orange-500/20 to-red-500/20 border-orange-500/30",
    Account: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    HR: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  };
  return (
    colors[category || ""] ||
    "from-violet-500/20 to-purple-500/20 border-violet-500/30"
  );
}
