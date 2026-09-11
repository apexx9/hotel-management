import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-8">
      <div
        className="mb-4 flex items-center gap-2.5 rounded-full border border-slate-200/70 bg-white px-4 py-2 shadow-sm"
        role="status"
        aria-label="Loading"
      >
        <Loader2 className="h-4 w-4 animate-spin text-[#1900FF]" />
        <span className="text-xs font-medium text-slate-500">Loading&hellip;</span>
      </div>
      <div className="mb-8 flex flex-col items-center gap-3">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <div className="w-full max-w-[480px] space-y-4">
        <Skeleton className="h-8 w-56 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-2xl" />
        ))}
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}