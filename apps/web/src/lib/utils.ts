import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: number | string) {
  const messageDate = new Date(date);
  const today = new Date();

  if (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  ) {
    return messageDate.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return messageDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
