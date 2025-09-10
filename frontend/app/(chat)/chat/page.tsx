"use client";

import ChatInterface from "@/components/chat/chat-interface";
import { useChatLayout } from "../layout";

export default function ChatPage() {
  const {
    chats,
    selectedChat,
    handleUpdateChat,
    isLoadingHistory,
    refreshChatList,
    moveToTop,
  } = useChatLayout();

  return (
    <ChatInterface
      chats={chats}
      selectedChat={selectedChat}
      onUpdateChat={handleUpdateChat}
      isLoadingHistory={isLoadingHistory}
      refreshChatList={refreshChatList}
      moveToTop={moveToTop}
    />
  );
}
