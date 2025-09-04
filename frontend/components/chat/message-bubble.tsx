"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (message.sender === "user") {
    return (
      <div className="flex justify-end mb-6 group">
        <div className="flex flex-col items-end max-w-[80%]">
          <div
            className="bg-accent text-foreground px-4 py-3 break-words overflow-wrap-anywhere"
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
    );
  }

  // AI message - no bubble, just text with proper markdown rendering
  return (
    <div className="mb-6 group">
      <div className="max-w-[80%]">
        {message.thinkingTime && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">
              Thought for {message.thinkingTime} seconds
            </span>
          </div>
        )}

        {/* Render markdown content with react-markdown */}
        <div className="text-sm leading-relaxed text-foreground mb-3 break-words overflow-wrap-anywhere prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono">
                  {children}
                </pre>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold mt-3 mb-2 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold mt-2 mb-1 text-foreground">
                  {children}
                </h3>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-2 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-foreground">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-muted-foreground pl-4 italic text-muted-foreground">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-blue-500 hover:text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto">
                  <table className="w-full border-collapse bg-muted/50 rounded-lg overflow-hidden">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-muted">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="border-b border-border last:border-b-0">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left font-semibold text-foreground bg-muted border-r border-border last:border-r-0">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-foreground border-r border-border last:border-r-0">
                  {children}
                </td>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
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
  );
}
