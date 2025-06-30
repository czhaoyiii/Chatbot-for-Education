"use client";

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [desktopPreference, setDesktopPreference] = useState(true); // Desktop default: open
  const [mobilePreference, setMobilePreference] = useState(false); // Mobile default: closed
  const [isInitialized, setIsInitialized] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;

      if (!isInitialized) {
        // Initial setup - set defaults
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
        setIsInitialized(true);
      } else {
        // Screen size changed - preserve user preference for each screen size
        setSidebarOpen(isDesktop ? desktopPreference : mobilePreference);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [desktopPreference, mobilePreference, isInitialized]);

  // Update preferences when user manually toggles sidebar
  const toggleSidebar = () => {
    const newState = !sidebarOpen
    setSidebarOpen(newState)

    // Save preference based on current screen size
    if (window.innerWidth >= 768) {
      setDesktopPreference(newState)
    } else {
      setMobilePreference(newState)
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header onToggleSidebar={toggleSidebar} />
      </div>
    </div>
  );
}
