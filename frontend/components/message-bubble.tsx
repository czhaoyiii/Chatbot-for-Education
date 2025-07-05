"use client"

import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"
import type { Message } from "@/types/chat"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  if (message.sender === "user") {
    return (
      <div className="flex justify-end mb-6 group">
        <div className="flex flex-col items-end max-w-[80%]">
          <div
            className="bg-foreground text-background px-4 py-3 break-words overflow-wrap-anywhere"
            style={{
              borderRadius: "18px 18px 4px 18px",
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere"
              style={{ wordBreak: "break-word" }}
            >
              {message.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-200 h-8 w-8 p-0 mt-1"
            title={copied ? "Copied!" : "Copy message"}
          >
            <Copy className={`w-3 h-3 ${copied ? "text-green-500" : ""}`} />
          </Button>
        </div>
      </div>
    )
  }

  // AI message - no bubble, just text with only copy button
  return (
    <div className="mb-6 group">
      <div className="max-w-[80%]">
        {message.thinkingTime && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Thought for {message.thinkingTime} seconds</span>
          </div>
        )}
        <div
          className="text-sm leading-relaxed text-foreground whitespace-pre-wrap mb-3 break-words overflow-wrap-anywhere"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {message.content}
        </div>

        {/* Only copy button */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="hover:bg-accent transition-all duration-200 h-8 w-8 p-0"
            title={copied ? "Copied!" : "Copy"}
          >
            <Copy className={`w-3 h-3 ${copied ? "text-green-500" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}
