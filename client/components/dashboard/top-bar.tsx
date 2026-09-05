"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import GuestsService from "@/services/guests.service";
import RoomsService from "@/services/rooms.service";
import StaysService from "@/services/stays.service";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NewBookingDialog } from "./booking-dialog";

interface SearchResult {
  id: string;
  type: "guest" | "room" | "stay";
  title: string;
  subtitle?: string;
  href: string;
}

export function Topbar() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const [guests, rooms, stays] = await Promise.all([
        GuestsService().getGuests(query.trim()),
        RoomsService()
          .getRooms()
          .then((rooms) =>
            rooms.filter((r) =>
              r.number.toLowerCase().includes(query.toLowerCase()),
            ),
          ),
        StaysService()
          .getActiveStays()
          .then((stays) =>
            stays.filter(
              (s) =>
                s.guestName?.toLowerCase().includes(query.toLowerCase()) ||
                s.reference?.toLowerCase().includes(query.toLowerCase()),
            ),
          ),
      ]);

      const guestResults: SearchResult[] = guests.map((g) => ({
        id: g.id,
        type: "guest",
        title: `${g.firstName} ${g.lastName}`,
        subtitle: g.phone ?? undefined,
        href: `/guests/${g.id}`,
      }));
      const roomResults: SearchResult[] = rooms.map((r) => ({
        id: r.id,
        type: "room",
        title: `Room ${r.number}`,
        subtitle: r.status ?? undefined,
        href: `/rooms/${r.id}`,
      }));
      const stayResults: SearchResult[] = stays.map((s) => ({
        id: s.id,
        type: "stay",
        title: `Stay ${s.reference} - ${s.guestName}`,
        subtitle: s.roomNumber ?? undefined,
        href: `/stays/${s.id}`,
      }));

      setResults([...guestResults, ...roomResults, ...stayResults].slice(0, 8));
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!searchModalOpen) return;
    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchModalOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === "Escape" && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchModalOpen]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const closeModal = () => {
    setSearchModalOpen(false);
    setSearchQuery("");
    setResults([]);
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-8">
        {/* Search trigger button - styled like the hero card buttons */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-400 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-600"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">Search guests, rooms, stays...</span>
          <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-medium text-slate-400 md:inline-block">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          {/* New Booking button - updated to use teal accent */}
          <button
            onClick={() => setBookingDialogOpen(true)}
            className="hidden h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 md:flex"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-900">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full text-blue-600 " />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-2xl border-blue-100 shadow-lg"
            >
              <DropdownMenuLabel className="text-blue-900">
                Notifications
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-100" />
              <div className="p-4 text-sm text-blue-500">
                No new notifications
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Search Modal - styled to match the Hero Card */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[15vh] backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <Search className="h-5 w-5 text-slate-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search guests, rooms, stays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 flex-1 border-0 bg-transparent text-lg text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {loading ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Searching...
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50"
                      onClick={() => {
                        router.push(result.href);
                        closeModal();
                      }}
                    >
                      <Badge
                        variant="outline"
                        className="rounded-md border-slate-200 bg-slate-50 text-slate-500 font-medium"
                      >
                        {result.type}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No results found.
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-slate-400">
                  Start typing to search...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Booking Dialog */}
      <NewBookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        onSuccess={() => {
          // Optionally navigate to reservations or refresh data
          router.push("/reservations");
        }}
      />
    </>
  );
}
