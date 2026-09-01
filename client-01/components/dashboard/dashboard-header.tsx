"use client";

import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function DashboardHeader({
  onRefresh,
  refreshing = false,
}: DashboardHeaderProps) {
  const today = new Intl.DateTimeFormat("en-GH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="flex flex-col gap-5 border-b bg-white px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
          <span>Overview</span>
          <span className="text-zinc-300">/</span>
          <span>{today}</span>
        </div>

        <h1 className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-[#0C0332]">
          {greeting}
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s happening across the hotel today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-9 gap-2 rounded-none border-zinc-200 bg-white px-3 text-xs"
        >
          <RefreshCw
            size={14}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </Button>

        <Button
          size="sm"
          className="h-9 gap-2 rounded-none bg-[#1900FF] px-4 text-xs hover:bg-[#1300cc]"
        >
          <Plus size={14} />
          New booking
        </Button>
      </div>
    </div>
  );
}
