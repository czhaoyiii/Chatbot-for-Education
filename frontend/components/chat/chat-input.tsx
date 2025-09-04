import { ArrowUp, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import type { Chat } from "@/types/chat";
import { getModuleInfo } from "@/lib/utils";

interface ChatInputProps {
  chats: Chat[];
  selectedChat: Chat | null;
  onSendMessage: (message: string) => void;
}

export default function ChatInput({
  chats,
  selectedChat,
  onSendMessage,
}: ChatInputProps) {
  const isDisabled = chats.length === 0 || !selectedChat;
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight, but respect min and max heights
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 24), 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isDisabled) {
      onSendMessage(input.trim());

      // Clear input after sending
      setInput("");

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isDisabled) {
        // Trigger form submission
        const form = e.currentTarget.closest("form");
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const getPlaceholderText = () => {
    if (chats.length === 0) {
      return "Start a new chat to begin...";
    }
    if (!selectedChat) {
      return "Select a chat to continue...";
    }
    const moduleInfo = getModuleInfo(selectedChat);
    return `Ask about ${moduleInfo}...`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm px-4 pb-4 z-10">
      <div className="max-w-4xl mx-auto">
        <form className="relative" onSubmit={handleSubmit}>
          <div
            className={`bg-accent rounded-3xl p-4 border border-border transition-all duration-200 shadow-lg ${
              isDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-muted-foreground"
            }`}
          >
            {/* Textarea on top */}
            <div className="mb-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                placeholder={getPlaceholderText()}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isDisabled}
                className={`w-full bg-transparent border-none text-foreground placeholder-muted-foreground focus:ring-0 focus:outline-none text-base resize-none leading-6 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent break-words overflow-wrap-anywhere overflow-y-auto ${
                  isDisabled ? "cursor-not-allowed" : ""
                }`}
                style={{
                  minHeight: "24px",
                  maxHeight: "200px",
                  height: "24px",
                  wordWrap: "break-word",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                }}
              />
            </div>

            {/* Icons row below textarea */}
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-all duration-200 h-8 w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                <Button
                  type="submit"
                  disabled={isDisabled || !input.trim()}
                  className="bg-foreground text-background hover:bg-muted-foreground rounded-full w-8 h-8 p-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
