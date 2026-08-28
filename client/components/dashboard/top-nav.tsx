"use client";

import { Menu, Search, Bell } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { routeTitles } from "@/utils/hms.data";

interface TopNavProps {
  onMenuClick: () => void;
}

export default function TopNav({ onMenuClick }: TopNavProps) {
  const pathname = usePathname();
  const title = useMemo(
    () => routeTitles[pathname] ?? "Hotel Operations",
    [pathname],
  );
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E8E8E8] bg-white/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 text-[#0C0332] hover:text-[#1900FF] hover:bg-[#F1F0FF] rounded-md transition-colors"
          aria-label="Open navigation sidebar"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-[13px] sm:text-[14px] font-bold text-[#0C0332] whitespace-nowrap">
          {title}
        </h1>
        <span className="text-[#D1D1D1] hidden sm:inline">/</span>
        <p className="hidden whitespace-nowrap text-[11px] font-medium text-[#8A8787] sm:inline sm:text-[12px]">
          {today}
        </p>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 flex-1 justify-end max-w-lg ml-4">
        {/* Functional Search Box */}
        <div className="relative flex items-center w-full max-w-[240px] sm:max-w-[280px]">
          <span className="absolute left-3 text-[#8A8787] pointer-events-none">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking, guest, room..."
            className="w-full h-9 pl-8 pr-12 text-[12px] font-medium border border-[#E8E8E8] rounded-lg bg-[#FBFBFC] text-[#0C0332] placeholder-neutral-400 focus:outline-none focus:border-[#1900FF] focus:bg-white focus:ring-1 focus:ring-[#1900FF] transition-all"
          />
          <span className="absolute right-2.5 text-[9px] font-bold tracking-widest text-neutral-400 border border-[#E8E8E8] px-1.5 py-0.5 rounded bg-white pointer-events-none select-none hidden sm:inline">
            ⌘K
          </span>
        </div>

        <button className="relative p-1.5 text-[#0C0332] hover:text-[#1900FF] hover:bg-[#F1F0FF] rounded-lg transition-colors shrink-0" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#1900FF] ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
