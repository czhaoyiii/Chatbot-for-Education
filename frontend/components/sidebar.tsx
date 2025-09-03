import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, ClipboardList, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { Chat, Module } from "@/types/chat";
import ModuleSelection from "./model-selection";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const pathname = usePathname();
  const router = useRouter();

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
    // Compute count from current non-temp chats to build the title
    const persistedCount = chats.filter(
      (c) => !c.id.startsWith("temp-") && c.module === selectedModule.code
    ).length;
    const seq = persistedCount + 1;
    const newChat: Chat = {
      id: `temp-${selectedModule.code}-${Date.now()}`,
      title: `${selectedModule.code} - ${selectedModule.name} - Chat ${seq}`,
      module: selectedModule.code,
      createdAt: new Date(),
    };

    // Select the freshly created chat immediately
    setSelectedChatId(newChat.id);

    // Replace any existing temp chat, then prepend the new one
    setChats((prev) => {
      const withoutEphemeral = prev.filter((c) => !c.id.startsWith("temp-"));
      return [newChat, ...withoutEphemeral];
    });

    // Ensure we are on the chat page to view the new conversation
    router.push("/chat");
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (pathname?.startsWith("/quiz")) {
      router.push("/chat");
    }
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
          className={`w-80 h-full bg-secondary border-r border-border flex flex-col shadow-xl md:shadow-lg transition-opacity duration-300 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0 md:opacity-0"
          }`}
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
              <Trash2 className="w-4 h-4" />
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
              className="w-full justify-start text-foreground border-border transition-all duration-200 group"
              tabIndex={isOpen ? 0 : -1}
              onClick={handleNewChat}
            >
              <MessageSquarePlus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
              New chat
            </Button>
            <Link href="/quiz" className="block">
              <Button
                variant="ghost"
                className="w-full justify-start text-foreground border-border transition-all duration-200 group"
                tabIndex={isOpen ? 0 : -1}
                onClick={() => {
                  // Unselect current chat and navigate to quiz
                  setSelectedChatId(null);
                  if (window.innerWidth < 768) onToggle();
                }}
              >
                <ClipboardList className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
                Quiz
              </Button>
            </Link>
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
                  <div
                    key={chat.id}
                    className={`relative flex items-center group`}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group-hover:bg-hover-accent group-hover:text-foreground ${
                        selectedChatId === chat.id
                          ? "bg-hover-accent text-foreground"
                          : "text-muted-foreground hover:bg-hover-accent hover:text-foreground"
                      }`}
                      tabIndex={isOpen ? 0 : -1}
                      onClick={() => handleSelectChat(chat.id)}
                    >
                      <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
                        {chat.title}
                      </span>
                    </Button>
                    <button
                      className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      title="Delete chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatToDelete(chat);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive hover:text-red-600" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Delete Chat Confirmation Dialog (Portal) */}
        {showDeleteDialog &&
          typeof window !== "undefined" &&
          createPortal(
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">
                      Delete Chat Session
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setChatToDelete(null);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Are you sure you want to delete "{chatToDelete?.title}"?
                    This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setChatToDelete(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={async () => {
                        if (chatToDelete) {
                          setChats((prev) =>
                            prev.filter((c) => c.id !== chatToDelete.id)
                          );
                          if (!chatToDelete.id.startsWith("temp-")) {
                            const { deleteChatSession } = await import(
                              "@/lib/chat-api"
                            );
                            await deleteChatSession(chatToDelete.id);
                          }
                          if (selectedChatId === chatToDelete.id) {
                            setSelectedChatId(null);
                          }
                        }
                        setShowDeleteDialog(false);
                        setChatToDelete(null);
                      }}
                    >
                      Delete Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
}
