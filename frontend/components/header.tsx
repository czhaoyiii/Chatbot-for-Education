"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Chat } from "@/types/chat";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  onToggleSidebar?: () => void;
  selectedChat?: Chat | null;
  variant?: "chat" | "professor";
  title?: string;
}

export default function Header({
  onToggleSidebar,
  selectedChat,
  variant = "chat",
  title,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
    setDropdownOpen(false);
  };

  const getModuleInfo = (chat: Chat | null) => {
    if (!chat) return null;
    const title = chat.title;
    const chatMatch = title.match(/^(.+?)(?:\s*-\s*Chat\s+\d+)?$/);
    return chatMatch ? chatMatch[1] : title;
  };

  const getDisplayTitle = () => {
    if (variant === "professor") {
      return title || "Professor Dashboard";
    }
    return getModuleInfo(selectedChat ?? null) || "EduChat";
  };

  const getAvatarColor = () => {
    return variant === "professor"
      ? "from-purple-500 to-purple-600"
      : "from-blue-500 to-blue-600";
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border-foreground bg-background/80 backdrop-blur-sm relative z-30">
      <div className="flex items-center space-x-3">
        {variant === "chat" && (
          <Button
            id="hamburger-menu"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
            onClick={onToggleSidebar}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}

        {variant === "professor" && (
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="EduChat Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>
        )}

        {/* Module name in center on mobile */}
        <div className="md:hidden">
          <span className="text-sm font-medium text-foreground">
            {variant === "chat"
              ? selectedChat
                ? selectedChat.module
                : "EduChat"
              : "Professor"}
          </span>
        </div>
      </div>

      {/* Center title for desktop */}
      <div className="hidden md:block">
        <span className="text-lg font-semibold text-foreground">
          {getDisplayTitle()}
        </span>
      </div>

      {/* Account Display */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            className="flex items-center space-x-2 hover:bg-accent transition-all duration-200 rounded-lg p-2"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div
              className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor()} rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
            >
              {user?.name?.slice(0, 2).toUpperCase() || "ZY"}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 hidden md:block ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl z-[100] animate-fade-in">
              <div className="py-2">
                {variant === "chat" && user?.role === "professor" && (
                  <Link href="/prof">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 px-4 py-2 rounded-none"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <GraduationCap className="w-4 h-4 mr-3" />
                      Professor Mode
                    </Button>
                  </Link>
                )}
                {variant === "professor" && (
                  <Link href="/chat">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 px-4 py-2 rounded-none"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-3" />
                      Back to Chat
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 px-4 py-2 rounded-none"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 px-4 py-2 rounded-none"
                  onClick={handleToggleTheme}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-4 h-4 mr-3" />
                      Light mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 mr-3" />
                      Dark mode
                    </>
                  )}
                </Button>

                <div className="border-t-2 border-border my-1" />
                <Button
                  variant="ghost"
                  className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-red-500 transition-all duration-200 px-4 py-2 rounded-none"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
