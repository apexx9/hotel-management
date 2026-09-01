"use client";

import {
  Bell,
  Command,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";

export default function Topbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-[280px] items-center gap-3 border bg-[#fafafa] px-3 text-left text-xs text-zinc-400 hover:bg-zinc-50"
        >
          <Search size={15} />

          <span className="flex-1">
            Search anything...
          </span>

          <span className="flex items-center gap-1 text-[10px] text-zinc-400">
            <Command size={11} />
            K
          </span>
        </button>

        {searchOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="mx-auto mt-24 w-full max-w-2xl border bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-14 items-center gap-3 border-b px-4">
                <Search size={18} className="text-zinc-400" />

                <input
                  autoFocus
                  placeholder="Search guests, reservations, rooms..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />

                <button
                  onClick={() => setSearchOpen(false)}
                  className="text-xs text-zinc-400 hover:text-black"
                >
                  ESC
                </button>
              </div>

              <div className="p-8 text-center text-sm text-zinc-400">
                Search will connect to your operational data.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 items-center gap-2 bg-[#1900FF] px-4 text-xs font-medium text-white hover:bg-[#1300cc]"
        >
          <Plus size={15} />
          New
        </button>

        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center border hover:bg-zinc-50"
        >
          <Bell size={17} strokeWidth={1.8} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 bg-[#1900FF]" />
        </button>
      </div>
    </header>
  );
}
