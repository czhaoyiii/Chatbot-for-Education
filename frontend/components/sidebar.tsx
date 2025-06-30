import Image from "next/image";
import { Button } from "./ui/button";
import { MessageSquarePlus, ClipboardList } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-65 bg-secondary border-r border-border flex flex-col h-screen transition-all duration-300 ease-in-out">
      <div className="p-4 flex-shrink-0">
        <Image
          src="/logo.png"
          alt="EduChat Logo"
          width={32}
          height={32}
          className="transition-transform duration-200 hover:scale-105 rounded-full"
        />
      </div>

      {/* Sidebar action buttons */}
      <div className="px-3 flex-shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start text-foreground border-border transition-all duration-200"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
          New chat
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-foreground border-border transition-all duration-200"
        >
          <ClipboardList className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:scale-110" />
          Quiz
        </Button>
      </div>

      {/* Chat History - Scrollable */}
      <div className="flex-1 px-3 pt-6 overflow-hidden flex flex-col">
        <h3 className="text-xs text-foreground pb-2 px-2 flex-shrink-0 tracking-wider">
          Chats
        </h3>
        {/* <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {chatSessions.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className={`w-full justify-start text-left h-auto py-3 px-3 flex-shrink-0 transition-all duration-200 rounded-lg group min-h-[3rem] ${
                currentChatId === chat.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
                {chat.title}
              </span>
            </Button>
          ))}
        </div> */}
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group bg-accent text-foreground"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-left px-3 h-auto flex-shrink-0 transition-all duration-200 rounded-lg group"
          >
            <span className="text-sm group-hover:text-foreground transition-colors duration-200 leading-relaxed whitespace-normal text-left">
              CZ4070- Cyber Threat Intelligence - Chat 8
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
