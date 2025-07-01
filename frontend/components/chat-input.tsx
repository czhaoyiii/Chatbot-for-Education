import { ArrowUp, Plus } from "lucide-react";
import { Button } from "./ui/button";

export default function ChatInput() {
  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      //   if (input.trim() && !isLoading && currentModule) {
      //     const form = e.currentTarget.closest("form");
      //     if (form) {
      //       const submitEvent = new Event("submit", {
      //         bubbles: true,
      //         cancelable: true,
      //       });
      //       form.dispatchEvent(submitEvent);
      //     }
      //   }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm px-4 pb-4 z-10">
      <div className="max-w-4xl mx-auto">
        <form className="relative">
          <div className="bg-accent rounded-3xl p-4 border border-border hover:border-muted-foreground transition-all duration-200 shadow-lg">
            {/* Textarea on top */}
            <div className="mb-3">
              <textarea
                placeholder="Select a module first..."
                onKeyDown={handleKeyDown}
                rows={1}
                className="w-full bg-transparent border-none text-foreground placeholder-muted-foreground focus:ring-0 focus:outline-none text-base resize-none leading-6 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent break-words overflow-wrap-anywhere"
                style={{
                  minHeight: "24px",
                  maxHeight: "200px",
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
                  className="text-muted-foreground hover:text-foreground rounded-full hover:bg-accent transition-all duration-200 h-8 w-8 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                <Button
                  type="submit"
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
