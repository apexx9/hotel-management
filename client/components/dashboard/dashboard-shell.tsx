"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Sidebar from "./sidebar";
import TopNav from "./top-nav";

interface DashboardShellProps {
  children: React.ReactNode;
}

const DashboardShell = ({ children }: DashboardShellProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Important:
  // Start with a deterministic value so the server and client
  // render the same HTML during hydration.
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");

    const updateDesktopState = () => {
      const desktop = media.matches;

      setIsDesktop(desktop);

      // Close the mobile drawer when switching to desktop.
      if (desktop) {
        setIsSidebarOpen(false);
      }

      // Reset desktop expansion when switching to mobile.
      if (!desktop) {
        setIsExpanded(false);
      }
    };

    // Determine the actual viewport after hydration.
    updateDesktopState();

    media.addEventListener("change", updateDesktopState);

    return () => {
      media.removeEventListener("change", updateDesktopState);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#0C0332]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isDesktop={isDesktop}
      />

      <motion.div
        animate={{
          paddingLeft: isDesktop ? (isExpanded ? 240 : 80) : 0,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex min-h-screen flex-col"
      >
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
};

export default DashboardShell;
