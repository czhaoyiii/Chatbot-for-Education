import Image from "next/image";
import { useRef } from "react";
import ChatInput from "./chat-input";

export default function ChatInterface() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden z-0">
      {/* Messages Area - Full height with proper overflow and bottom padding */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ paddingBottom: "160px" }} // Increased space for taller input area
      >
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
      <ChatInput />
    </div>
  );
}
