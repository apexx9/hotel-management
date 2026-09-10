"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import operationsApi from "@/actions/operations";
import NotificationsService, {
  AppNotification,
} from "@/services/notifications.service";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NewBookingDialog } from "./booking-dialog";

interface SearchResult {
  id: string;
  type: "guest" | "room" | "stay" | "room-type";
  title: string;
  subtitle?: string;
  href: string;
}

const notificationHref = (n: AppNotification): string => {
  switch (n.type) {
    case "checkout_completed":
    case "checkout_overdue":
      return "/front-desk/departures";
    case "guest_arrival":
      return "/front-desk/arrivals";
    case "room_ready":
    case "room_unavailable":
    case "maintenance_issue":
      return "/front-desk/room-status";
    case "payment_outstanding":
      return "/finance";
    case "service_charge_added":
    case "new_booking":
    default:
      return "/reservations";
  }
};

const searchTypeLabels: Record<string, string> = {
  guest: "guest",
  room: "room",
  stay: "stay",
  "room-type": "room type",
};

export function Topbar() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = async () => {
    try {
      const data = await NotificationsService().getNotifications();
      setNotifications(data ?? []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = (
        await operationsApi.globalSearch({ q: query.trim() })
      ).data;

      setResults([
        ...data.guests.map((g) => ({
          id: g.id,
          type: "guest" as const,
          title: g.title,
          subtitle: g.subtitle ?? undefined,
          href: "/guests",
        })),
        ...data.rooms.map((r) => ({
          id: r.id,
          type: "room" as const,
          title: r.title,
          subtitle: r.subtitle ?? undefined,
          href: "/rooms",
        })),
        ...data.stays.map((s) => ({
          id: s.id,
          type: "stay" as const,
          title: s.title,
          subtitle: s.subtitle ?? undefined,
          href: "/reservations",
        })),
        ...data.roomTypes.map((rt) => ({
          id: rt.id,
          type: "room-type" as const,
          title: rt.title,
          subtitle: rt.subtitle ?? undefined,
          href: "/rooms/types",
        })),
      ]);
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

  // Keyboard shortcuts: ⌘K or / opens search, N opens new booking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setSearchModalOpen(true);
      } else if (e.key.toLowerCase() === "n" && !isTyping) {
        e.preventDefault();
        setBookingDialogOpen(true);
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

  const handleNotificationClick = async (n: AppNotification) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
    );
    try {
      await NotificationsService().markAsRead(n.id);
    } catch {
      // keep optimistic read state
    }
    router.push(notificationHref(n));
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
          <DropdownMenu onOpenChange={(open) => open && fetchNotifications()}>
            <DropdownMenuTrigger className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-blue-500 transition-colors hover:bg-blue-100 hover:text-blue-900">
              <Bell className="h-5 w-5" />
              {notifications.some((n) => !n.isRead) && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-2xl border-blue-100 shadow-lg"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-blue-900">
                  Notifications
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-blue-100" />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-blue-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex cursor-pointer items-start gap-2 px-4 py-3 text-sm"
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {n.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {n.message}
                        </div>
                      </div>
                      {!n.isRead && (
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
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
                        {searchTypeLabels[result.type] ?? result.type}
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
