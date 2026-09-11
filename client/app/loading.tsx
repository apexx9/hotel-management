import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6">
      <div
        className="flex items-center gap-2.5 rounded-full border border-slate-200/70 bg-white px-4 py-2 shadow-sm"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#1900FF]" />
        <span className="text-xs font-medium text-slate-500">Loading&hellip;</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#1900FF]" />
        <Skeleton className="h-6 w-28 rounded-lg" />
      </div>
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-9 w-3/4 rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-2xl" />
        ))}
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}