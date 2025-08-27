"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Module } from "@/types/chat";
import { supabase } from "@/lib/supabase";

interface ModuleSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (module: Module) => void;
}

export default function ModuleSelection({
  isOpen,
  onClose,
  onStartChat,
}: ModuleSelectionProps) {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from Supabase when the modal opens
  useEffect(() => {
    const fetchCourses = async () => {
      if (!isOpen) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("code,name")
          .order("code", { ascending: true });

        if (error) throw error;
        // Coerce to Module[] shape
        setModules((data || []).map((c) => ({ code: c.code, name: c.name })));
      } catch (e: any) {
        setError(e?.message || "Failed to load courses");
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isOpen]);

  const handleStartChat = () => {
    if (selectedModule) {
      onStartChat(selectedModule);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedModule(null);
    setDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Select Module
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-muted-foreground mb-6">
            What module do you want to chat with?
          </p>

          <div className="relative mb-6">
            <Button
              variant="outline"
              className="w-full justify-between text-left bg-transparent"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
            >
              {selectedModule
                ? `${selectedModule.code} - ${selectedModule.name}`
                : loading
                ? "Loading courses..."
                : error
                ? "Failed to load courses"
                : modules.length > 0
                ? "Choose a module..."
                : "No courses available"}
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
                {error && (
                  <div className="px-3 py-2 text-sm text-red-500">{error}</div>
                )}
                {!error && modules.length === 0 && !loading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No courses found
                  </div>
                )}
                {!error && modules.length > 0 && (
                  <div className="max-h-64 overflow-auto">
                    {modules.map((module) => (
                      <button
                        key={module.code}
                        className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-200 first:rounded-t-md last:rounded-b-md"
                        onClick={() => {
                          setSelectedModule(module);
                          setDropdownOpen(false);
                        }}
                      >
                        {module.code} - {module.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-foreground text-background hover:bg-muted-foreground"
              onClick={handleStartChat}
              disabled={!selectedModule}
            >
              Start Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
