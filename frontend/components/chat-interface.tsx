import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ChatInput from "./chat-input";
import type { Chat, Message } from "@/types/chat";
import { getModuleInfo } from "@/lib/utils";
import ThinkingIndicator from "./thinking-indicator";
import MessageBubble from "./message-bubble";

interface ChatInterfaceProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onUpdateChat: (chatId: string, messages: Message[]) => void;
}

export default function ChatInterface({
  chats,
  selectedChat,
  onUpdateChat,
}: ChatInterfaceProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [isThinking, setIsThinking] = useState(false);
  const messages = selectedChat?.messages || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

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

    // Simulate AI thinking time (2-8 seconds)
    const thinkingTime = Math.floor(Math.random() * 7) + 2;

    setTimeout(() => {
      setIsThinking(false);

      // Generate AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: generateAIResponse(content),
        sender: "ai",
        timestamp: new Date(),
        thinkingTime,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      onUpdateChat(selectedChat.id, finalMessages);
    }, thinkingTime * 1000);
  };

  const generateAIResponse = (userQuestion: string): string => {
    const responses = [
      `That's a great question! Here's what you need to know:\n\nYour question: ${userQuestion}\n\nThis is a mock response. In a real implementation, this would be connected to an AI service that has been trained on your course materials.`,
      `Excellent question! Let me break this down for you:\n\nYour question: ${userQuestion}\n\nThis is a simulated response. In the actual system, I would analyze your course materials and provide specific, relevant information based on your modules.`,
      `Great question! Here's my response:\n\nYour question: ${userQuestion}\n\nThis is a demonstration response. The real system would connect to AI models trained specifically on your NTU course content to provide accurate, contextual answers.`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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
                Ask me anything about {selectedChat.title.split(" - Chat")[0]}.
              </p>
            </div>
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
<ChatInput chats={chats} selectedChat={selectedChat} onSendMessage={handleSendMessage} />    </div>
  );
}
