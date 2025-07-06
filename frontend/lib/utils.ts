import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Chat } from "@/types/chat";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getModuleInfo(chat: Chat | null): string | null {
  if (!chat) return null;

  // Extract just the module code and name, removing " - Chat X" part
  const title = chat.title;
  const chatMatch = title.match(/^(.+?)(?:\s*-\s*Chat\s+\d+)?$/);
  return chatMatch ? chatMatch[1] : title;
}
