"use client";

import ChatInterface from "@/components/chat-interface";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import ProtectedRoute from "@/components/protected-route";
import type { Chat, Message } from "@/types/chat";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { fetchSessionMessages, fetchUserSessions } from "@/lib/chat-api";

export default function ChatPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [desktopPreference, setDesktopPreference] = useState(true); // Desktop default: open
  const [mobilePreference, setMobilePreference] = useState(false); // Mobile default: closed
  const [isInitialized, setIsInitialized] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Load existing sessions for user
  useEffect(() => {
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
        setChats(mapped);
        if (mapped.length > 0 && !selectedChatId) {
          setSelectedChatId(mapped[0].id);
        }
      } catch (e) {
        // silently ignore for now
      }
    };
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;

      if (!isInitialized) {
        // Initial setup - set defaults
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
        setIsInitialized(true);
      } else {
        // Screen size changed - preserve user preference for each screen size
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopPreference, mobilePreference, isInitialized]);

  // Update preferences when user manually toggles sidebar
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // Save preference based on current screen size
    if (window.innerWidth >= 768) {
      setDesktopPreference(newState);
    } else {
      setMobilePreference(newState);
    }
  };

  // Update chat messages
  const handleUpdateChat = (chatId: string, messages: Message[]) => {
    setChats((prevChats) => {
      const exists = prevChats.some((c) => c.id === chatId);
      if (exists) {
        return prevChats.map((c) => (c.id === chatId ? { ...c, messages } : c));
      }
      // If not exists, assume we're renaming the currently selected temp chat to persisted session ID
      if (selectedChatId) {
        return prevChats.map((c) =>
          c.id === selectedChatId ? { ...c, id: chatId, messages } : c
        );
      }
      return prevChats;
    });
    // If new id differs, ensure selection follows the renamed chat
    setSelectedChatId((prev) => (prev && prev !== chatId ? chatId : prev));
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

  // When selecting a chat, load its messages if not yet loaded
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChat) return;
      if (selectedChat.messages && selectedChat.messages.length > 0) return;
      try {
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
      } catch (e) {
        // ignore
      }
    };
    loadMessages();
  }, [selectedChat?.id]);

  return (
    <ProtectedRoute>
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
          <Header onToggleSidebar={toggleSidebar} selectedChat={selectedChat} />
          <ChatInterface
            chats={chats}
            selectedChat={selectedChat}
            onUpdateChat={handleUpdateChat}
          />{" "}
        </div>
      </div>
    </ProtectedRoute>
  );
}
