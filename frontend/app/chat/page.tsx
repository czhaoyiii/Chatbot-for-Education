"use client";

import ChatInterface from "@/components/chat-interface";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import type { Chat, Message } from "@/types/chat";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [desktopPreference, setDesktopPreference] = useState(true); // Desktop default: open
  const [mobilePreference, setMobilePreference] = useState(false); // Mobile default: closed
  const [isInitialized, setIsInitialized] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

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
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages } : chat
      )
    );
  };

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

  return (
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
  );
}
