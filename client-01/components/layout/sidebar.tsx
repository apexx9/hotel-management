"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
  LogOut,
  ChevronDown,
} from "lucide-react";
import useAuthStore from "@/store/useAuthStore";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Front Desk",
    href: "/front-desk",
    icon: ClipboardList,
  },
  {
    label: "Reservations",
    href: "/reservations",
    icon: CalendarDays,
  },
  {
    label: "Rooms",
    href: "/rooms",
    icon: BedDouble,
  },
  {
    label: "Guests",
    href: "/guests",
    icon: Users,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: WalletCards,
  },
  {
    label: "Operations",
    href: "/operations",
    icon: ClipboardList,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const authStore = useAuthStore();
  const user = authStore.user;

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col bg-[#0C0332] text-white">
      <div className="flex h-[72px] items-center border-b border-white/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center bg-[#1900FF] text-sm font-bold">
            H
          </div>

          <div className="leading-none">
            <p className="text-sm font-semibold tracking-tight">
              HOTEL
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">
              Operations
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex h-10 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
                  active
                    ? "border-[#1900FF] bg-white/[0.08] text-white"
                    : "border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                <Icon
                  size={17}
                  strokeWidth={1.8}
                  className={
                    active
                      ? "text-white"
                      : "text-white/40 group-hover:text-white/70"
                  }
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
            System
          </p>

          <Link
            href="/settings"
            className={[
              "flex h-10 items-center gap-3 border-l-2 px-3 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "border-[#1900FF] bg-white/[0.08] text-white"
                : "border-transparent text-white/55 hover:bg-white/[0.05] hover:text-white",
            ].join(" ")}
          >
            <Settings size={17} strokeWidth={1.8} />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-white/[0.05]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-white/10 text-xs font-semibold">
            {user?.email?.charAt(0).toUpperCase() ?? "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">
              {user?.email ?? "Hotel User"}
            </p>

            <p className="mt-1 text-[10px] text-white/40">
              Staff account
            </p>
          </div>

          <ChevronDown size={15} className="text-white/40" />
        </button>

        <button
          type="button"
          className="mt-1 flex h-9 w-full items-center gap-3 px-3 text-xs text-white/45 hover:bg-white/[0.05] hover:text-white"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
