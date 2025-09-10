"use client";

import type React from "react";
import ProtectedRoute from "@/components/protected-route";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Chat, Message } from "@/types/chat";
import { useAuth } from "@/contexts/auth-context";
import { fetchSessionMessages, fetchUserSessions } from "@/lib/chat-api";
import { usePathname, useRouter } from "next/navigation";

type ChatLayoutContextType = {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  // Chats state
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  selectedChatId: string | null;
  setSelectedChatId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedChat: Chat | null;
  isLoadingHistory: boolean;
  handleUpdateChat: (chatId: string, messages: Message[]) => void;
  refreshChatList: () => Promise<void>;
  moveToTop: (chatId: string) => void;
};

const ChatLayoutContext = createContext<ChatLayoutContextType | undefined>(
  undefined
);

export function useChatLayout() {
  const ctx = useContext(ChatLayoutContext);
  if (!ctx) throw new Error("useChatLayout must be used within ChatLayout");
  return ctx;
}

export default function ChatGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopPreference, setDesktopPreference] = useState(true);
  const [mobilePreference, setMobilePreference] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Chat state
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load sessions for authenticated user
  const loadSessions = async () => {
    if (!user?.id && !user?.email) return;
    try {
      const sessions = await fetchUserSessions({
        userId: user?.id,
        userEmail: user?.email,
      });
      const mapped: Chat[] = sessions.map((s) => ({
        id: s.id,
        title: s.title,
        module: s.module || "",
        createdAt: new Date(s.createdAt),
      }));
      // Merge fetched sessions with existing state to preserve temp chats and any loaded messages
      setChats((prev) => {
        const tempChats = prev.filter((c) => c.id.startsWith("temp-"));

        // Create a map of existing chats for quick lookup by both ID and title
        const existingChatsMap = new Map(prev.map((c) => [c.id, c]));
        const existingTitlesMap = new Map(prev.map((c) => [c.title, c]));

        // Filter out server sessions that already exist locally (by ID or title)
        const newServerSessions = mapped.filter((serverSession) => {
          const existsByID = existingChatsMap.has(serverSession.id);
          const existsByTitle = existingTitlesMap.has(serverSession.title);
          return !existsByID && !existsByTitle;
        });

        // Merge new server sessions with existing local state, preserving messages
        const mergedPersisted = prev
          .filter((c) => !c.id.startsWith("temp-"))
          .map((existingChat) => {
            const serverSession = mapped.find((s) => s.id === existingChat.id);
            return serverSession && existingChat.messages
              ? { ...serverSession, messages: existingChat.messages }
              : existingChat;
          });

        // Add any completely new server sessions
        const finalResult = [
          ...tempChats,
          ...mergedPersisted,
          ...newServerSessions,
        ];

        // Debug: Check for duplicates by title
        const titles = finalResult.map((c) => c.title);
        const duplicateTitles = titles.filter(
          (title, index) => titles.indexOf(title) !== index
        );
        if (duplicateTitles.length > 0) {
          console.warn("Duplicate chat titles detected:", duplicateTitles);
          console.warn(
            "All chats:",
            finalResult.map((c) => ({ id: c.id, title: c.title }))
          );
        }

        return finalResult;
      });
      // Only auto-select a chat if none is selected and we aren't on the quiz route
      if (
        mapped.length > 0 &&
        !selectedChatId &&
        !pathname?.startsWith("/quiz")
      ) {
        setSelectedChatId(mapped[0].id);
      }
    } catch {}
  };

  // Refresh chat list (to be called after sending messages)
  const refreshChatList = async () => {
    await loadSessions();
  };

  // Move a specific chat to the top (for existing sessions after sending messages)
  const moveToTop = (chatId: string) => {
    setChats((prev) => {
      const chatToMove = prev.find((c) => c.id === chatId);
      if (!chatToMove) return prev;

      const otherChats = prev.filter((c) => c.id !== chatId);
      return [chatToMove, ...otherChats];
    });
  };

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email, pathname]);

  // Responsive sidebar open/close with preference per breakpoint
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      if (!isInitialized) {
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
        setIsInitialized(true);
      } else {
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopPreference, mobilePreference, isInitialized]);

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 768) setDesktopPreference(newState);
      else setMobilePreference(newState);
    }
  };

  // Selected chat
  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) || null,
    [chats, selectedChatId]
  );

  // Load messages when selecting a chat if not yet loaded
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) return;
      if (selectedChat.messages && selectedChat.messages.length > 0) {
        setIsLoadingHistory(false);
        return;
      }
      try {
        setIsLoadingHistory(true);
        const msgs = await fetchSessionMessages(selectedChat.id);
        const mapped: Message[] = msgs.map((m) => ({
          id: m.id,
          content: m.content,
          sender: m.sender,
          timestamp: new Date(m.createdAt),
          thinkingTime: m.thinkingTime,
        }));
        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChat.id ? { ...c, messages: mapped } : c
          )
        );
      } catch {
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadMessages();
  }, [selectedChat?.id]);

  // Update chat messages and track renames when temp id becomes persisted id
  const handleUpdateChat = (chatId: string, messages: Message[]) => {
    setChats((prevChats) => {
      const exists = prevChats.some((c) => c.id === chatId);
      if (exists)
        return prevChats.map((c) => (c.id === chatId ? { ...c, messages } : c));
      if (selectedChatId)
        return prevChats.map((c) =>
          c.id === selectedChatId ? { ...c, id: chatId, messages } : c
        );
      return prevChats;
    });
    setSelectedChatId((prev) => (prev && prev !== chatId ? chatId : prev));
  };

  // When navigating to /quiz, unselect any active chat so UI doesn't highlight it
  useEffect(() => {
    if (pathname?.startsWith("/quiz")) setSelectedChatId(null);
  }, [pathname]);

  const ctxValue: ChatLayoutContextType = {
    sidebarOpen,
    toggleSidebar,
    chats,
    setChats,
    selectedChatId,
    setSelectedChatId,
    selectedChat,
    isLoadingHistory,
    handleUpdateChat,
    refreshChatList,
    moveToTop,
  };

  return (
    <ProtectedRoute>
      <ChatLayoutContext.Provider value={ctxValue}>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            chats={chats}
            setChats={setChats}
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
          />
          <div className="flex-1 flex flex-col min-w-0 relative">
            <Header
              onToggleSidebar={toggleSidebar}
              selectedChat={selectedChat}
              title={pathname?.startsWith("/quiz") ? "Quiz" : undefined}
            />
            {children}
          </div>
        </div>
      </ChatLayoutContext.Provider>
    </ProtectedRoute>
  );
}
