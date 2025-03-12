"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { LeftSidebar } from "@/components/left-sidebar";
import { MainContent } from "@/components/main-content";
import { useToast } from "@/components/ui/toast";

export default function OmniInterface() {
  const { addToast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if API key is set
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-api-key");

        if (!response.ok) {
          console.error("Failed to check API key status");
          return;
        }

        const data = await response.json();

        if (!data.isSet) {
          addToast({
            type: "info",
            title: "API Key Required",
            description:
              "Please set your Meshy API key in the environment variables to use the Text to 3D feature.",
            duration: 10000,
          });
        }
      } catch (error) {
        console.error("Error checking API key:", error);
      }
    };

    checkApiKey();
  }, [addToast]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only apply this on mobile
      if (window.innerWidth >= 768) return;

      const sidebar = document.getElementById("left-sidebar");
      const toggleButton = document.getElementById("sidebar-toggle");

      if (
        sidebar &&
        !sidebar.contains(event.target as Node) &&
        toggleButton &&
        !toggleButton.contains(event.target as Node) &&
        sidebarOpen
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex flex-col h-screen bg-[#160422]">
      {/* Script to fix iOS viewport height issues */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
        function updateVh() {
          let vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', vh + 'px');
        }
        updateVh();
        window.addEventListener('resize', updateVh);
      `,
        }}
      />

      {/* Pass sidebarOpen and setSidebarOpen to Navbar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Remove the mobile sidebar toggle button that was here */}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Left sidebar with mobile toggle */}
        <div
          id="left-sidebar"
          className={`
            absolute md:relative z-40 md:z-auto
            ${sidebarOpen ? "left-0" : "-left-full md:left-0"} 
            transition-all duration-300 ease-in-out
            w-[85%] md:w-[360px] h-[calc(100vh-60px)] md:h-auto
          `}
        >
          <LeftSidebar />
        </div>

        <MainContent />
      </div>
    </div>
  );
}
