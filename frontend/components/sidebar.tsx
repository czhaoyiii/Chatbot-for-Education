import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, ClipboardList, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Chat, Module } from "@/types/chat";
import ModuleSelection from "./model-selection";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChatId: string | null;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function Sidebar({
  isOpen,
  onToggle,
  chats,
  setChats,
  selectedChatId,
  setSelectedChatId,
}: SidebarProps) {
  const [showModuleDialog, setShowModuleDialog] = useState(false);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const hamburger = document.getElementById("hamburger-menu");

      if (window.innerWidth < 768 && isOpen && sidebar && hamburger) {
        if (
          !sidebar.contains(event.target as Node) &&
          !hamburger.contains(event.target as Node)
        ) {
          onToggle();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (window.innerWidth < 768) {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleNewChat = () => {
    setShowModuleDialog(true);
  };

  const handleStartChat = (selectedModule: Module) => {
    const chatCount =
      chats.filter((chat) => chat.module === selectedModule.code).length + 1;
    const newChat: Chat = {
      id: `${selectedModule.code}-${Date.now()}`,
      title: `${selectedModule.code} - ${selectedModule.name}${
        chatCount > 1 ? ` - Chat ${chatCount}` : ""
      }`,
      module: selectedModule.code,
      createdAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newChat.id);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out opacity-100"
          onClick={onToggle}
        />
      )}

      {/* Module Selection Dialog */}
      <ModuleSelection
        isOpen={showModuleDialog}
        onClose={() => setShowModuleDialog(false)}
        onStartChat={handleStartChat}
      />

      {/* Sidebar Container - Different positioning for mobile vs desktop */}
      <div
        className={`
          fixed md:relative
          top-0 left-0 
          w-65
          h-full md:h-screen
          z-50 md:z-auto
          transition-all duration-300 ease-in-out
          ${
            isOpen
              ? "translate-x-0 md:translate-x-0"
              : "-translate-x-full md:-translate-x-full"
          }
          ${isOpen ? "md:w-80" : "md:w-0"}
        `}
      >
        {/* Sidebar Content - Only visible when open */}
        <div
          id="mobile-sidebar"
          className={`
            w-80 h-full bg-secondary border-r border-border flex flex-col shadow-xl md:shadow-lg
            transition-opacity duration-300 ease-in-out
            ${isOpen ? "opacity-100" : "opacity-0 md:opacity-0"}
          `}
          inert={!isOpen}
          aria-hidden={!isOpen}
        >
          {/* Mobile Header with Close Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
            <Image
              src="/logo.png"
              alt="EduChat Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-muted-foreground hover:text-foreground"
              tabIndex={isOpen ? 0 : -1}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="hidden md:block p-4 flex-shrink-0">
            <Image
              src="/logo.png"
              alt="EduChat Logo"
              width={32}
              height={32}
              className="transition-transform duration-200 hover:scale-105 rounded-full"
            />
          </div>

          {/* Sidebar action buttons */}
          <div className="px-3 flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground border-border transition-all duration-200"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleNewChat}
            >
              <MessageSquarePlus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              New chat
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground border-border transition-all duration-200"
              tabIndex={isOpen ? 0 : -1}
            >
              <ClipboardList className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              Quiz
            </Button>
          </div>

          {/* Chat History - Scrollable */}
          <div className="flex-1 px-3 pt-6 overflow-hidden flex flex-col">
            <h3 className="text-xs text-foreground pb-2 px-2 flex-shrink-0 tracking-wider">
              Chats
            </h3>
            <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {chats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No chat history yet
                  </p>
                </div>
              ) : (
                chats.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={`w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group text-foreground hover:bg-accent hover:text-foreground ${
                      selectedChatId === chat.id
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
                      {chat.title}
                    </span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
