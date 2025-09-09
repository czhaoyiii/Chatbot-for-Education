import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ChatInput from "./chat-input";
import type { Chat, Message } from "@/types/chat";
import ThinkingIndicator from "./thinking-indicator";
import MessageBubble from "./message-bubble";
import { sendChatMessage } from "@/lib/chat-api";
import { useAuth } from "@/contexts/auth-context";

interface ChatInterfaceProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onUpdateChat: (chatId: string, messages: Message[]) => void;
  isLoadingHistory?: boolean;
  refreshChatList?: () => Promise<void>;
}

export default function ChatInterface({
  chats,
  selectedChat,
  onUpdateChat,
  isLoadingHistory = false,
  refreshChatList,
}: ChatInterfaceProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [isThinking, setIsThinking] = useState(false);
  const messages = selectedChat?.messages || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // Reset session binding when switching selected chat
  useEffect(() => {
    if (!selectedChat) {
      setSessionId(null);
      setIsThinking(false);
      return;
    }
    // If the selected chat is a persisted session, bind to its id; otherwise clear until first send
    if (selectedChat.id && !selectedChat.id.startsWith("temp-")) {
      setSessionId(selectedChat.id);
    } else {
      setSessionId(null);
    }
    setIsThinking(false);
  }, [selectedChat?.id]);

  const handleSendMessage = async (content: string) => {
    if (!selectedChat) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    onUpdateChat(selectedChat.id, updatedMessages);

    // Show thinking indicator
    setIsThinking(true);

    try {
      // Start the API call and refresh chat list to show immediate feedback
      const apiCallPromise = sendChatMessage(content, {
        userId: user?.id,
        userEmail: user?.email,
        courseCode: selectedChat.module,
        sessionId: sessionId || undefined,
      });

      // Refresh chat list after a small delay to allow backend to process the user message
      if (refreshChatList) {
        setTimeout(async () => {
          try {
            await refreshChatList();
          } catch (error) {
            console.warn("Failed to refresh chat list:", error);
          }
        }, 500);
      }

      // Wait for the full API response
      const startTime = Date.now();
      const result = await apiCallPromise;
      const endTime = Date.now();
      const thinkingTime = Math.ceil((endTime - startTime) / 1000);

      setIsThinking(false);

      // AI response
      if (result.success && result.response) {
        if (result.session_id && !sessionId) {
          setSessionId(result.session_id);
          // Replace temp chat ID with persisted session ID in parent state
          onUpdateChat(result.session_id, updatedMessages);
          // Note: caller must ensure replacing the chat item ID in the list; we handle messages update here
        }
        // Add AI response
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          content: result.response,
          sender: "ai",
          timestamp: new Date(),
          thinkingTime: result.thinking_time ?? thinkingTime,
        };

        const finalMessages = [...updatedMessages, aiMessage];
        onUpdateChat(result.session_id || selectedChat.id, finalMessages);
      } else {
        // Handle error case
        const errorMessage: Message = {
          id: `ai-${Date.now()}`,
          content: `Sorry, I encountered an error: ${
            result.error || "Unknown error"
          }. Please try again.`,
          sender: "ai",
          timestamp: new Date(),
          thinkingTime,
        };

        const finalMessages = [...updatedMessages, errorMessage];
        onUpdateChat(selectedChat.id, finalMessages);
      }
    } catch (error) {
      setIsThinking(false);

      // Add error message
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        content:
          "Sorry, I'm having trouble connecting to the server. Please check your connection and try again.",
        sender: "ai",
        timestamp: new Date(),
        thinkingTime: 1,
      };

      const finalMessages = [...updatedMessages, errorMessage];
      onUpdateChat(selectedChat.id, finalMessages);
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl px-4 animate-fade-in">
              <div className="mb-6">
                <Image
                  src="/logo.png"
                  alt="EduChat Logo"
                  width={64}
                  height={64}
                  className="mx-auto mb-4 shadow-2xl rounded-full"
                />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Welcome to EduChat!
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Select a module to start chatting.
              </p>
            </div>
          </div>
        </div>
        <ChatInput
          chats={chats}
          selectedChat={selectedChat}
          onSendMessage={handleSendMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent px-4 py-4"
        style={{ paddingBottom: "160px" }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {isLoadingHistory ? (
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <div className="text-center max-w-2xl px-4 animate-fade-in">
                <div className="mb-6">
                  <Image
                    src="/logo.png"
                    alt="EduChat Logo"
                    width={64}
                    height={64}
                    className="mx-auto mb-4 shadow-2xl rounded-full"
                  />
                </div>
                <h1 className="text-4xl font-bold mb-4 text-foreground">
                  Welcome to {selectedChat.module}!
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Ask me anything about {selectedChat.title.split(" - Chat")[0]}
                  .
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isThinking && <ThinkingIndicator />}
          </div>
        )}
      </div>
      <ChatInput
        chats={chats}
        selectedChat={selectedChat}
        onSendMessage={handleSendMessage}
      />{" "}
    </div>
  );
}
