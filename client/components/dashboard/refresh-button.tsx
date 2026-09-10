"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => Promise<void> | void;
  className?: string;
  compact?: boolean;
}

export function RefreshButton({
  onRefresh,
  className,
  compact = false,
}: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setSpinning(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Refresh data"
      title="Refresh data"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900",
        compact ? "h-8 w-8 justify-center" : "px-3",
        className,
      )}
    >
      <RefreshCw
        className={cn("h-4 w-4", spinning && "animate-spin")}
      />
      {!compact && "Refresh"}
    </button>
  );
}