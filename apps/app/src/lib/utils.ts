import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(number: number): string {
  if (number >= 1_000_000) {
    return (number / 1_000_000).toFixed(1) + "M";
  }
  if (number >= 1_000) {
    return (number / 1_000).toFixed(1) + "k";
  }
  return number.toString();
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getPlatformBadgeColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case "facebook":
      return "bg-blue-600/10 text-blue-400 border-blue-500/20";
    case "instagram":
      return "bg-pink-600/10 text-pink-400 border-pink-500/20";
    case "tiktok":
      return "bg-neutral-800 text-neutral-200 border-neutral-700";
    case "linkedin":
      return "bg-sky-700/10 text-sky-400 border-sky-600/20";
    case "youtube":
      return "bg-red-600/10 text-red-400 border-red-500/20";
    case "reddit":
      return "bg-orange-600/10 text-orange-400 border-orange-500/20";
    case "threads":
      return "bg-purple-600/10 text-purple-300 border-purple-500/20";
    default:
      return "bg-slate-800 text-slate-300 border-slate-700";
  }
}
