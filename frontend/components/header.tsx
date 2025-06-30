"use client";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme-context";
import { ChevronDown, LogOut, Menu, Moon, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
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

  return (
    <div className="flex items-center justify-between p-4 border-b border-border-foreground bg-background/80 backdrop-blur-sm relative z-30">
      <div className="flex items-center space-x-3">
        <Button
          id="hamburger-menu"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 rounded-lg"
          onClick={onToggleSidebar}
        >
          <Menu className="w-4 h-4" />
        </Button>

        {/* Module name in center on mobile */}
        <div className="md:hidden">
          <span className="text-sm font-medium text-foreground">CZ4022</span>
        </div>
      </div>

      {/* Center title for desktop */}
      <div className="hidden md:block">
        <span className="text-lg font-semibold text-foreground">
          CZ4022 - Wireless & Mobile Networks
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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
              ZY
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
