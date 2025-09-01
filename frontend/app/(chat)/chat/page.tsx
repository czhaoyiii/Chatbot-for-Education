"use client";

import ChatInterface from "@/components/chat-interface";
import { useChatLayout } from "../layout";

export default function ChatPage() {
  const { chats, selectedChat, handleUpdateChat, isLoadingHistory } =
    useChatLayout();

  return (
    <ChatInterface
      chats={chats}
      selectedChat={selectedChat}
      onUpdateChat={handleUpdateChat}
      isLoadingHistory={isLoadingHistory}
    />
  );
}
