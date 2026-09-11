import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface PageLoadingProps {
  showHeader?: boolean;
  showPills?: boolean;
  showStats?: number;
  showGrid?: boolean;
  showTable?: boolean;
  showCards?: number;
}

export function PageLoading({
  showHeader = true,
  showPills = false,
  showStats = 0,
  showGrid = false,
  showTable = false,
  showCards = 0,
}: PageLoadingProps) {
  return (
    <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto">
      <div className="mb-2 flex items-center justify-center">
        <div
          className="flex items-center gap-2.5 rounded-full border border-slate-200/70 bg-white px-4 py-2 shadow-sm"
          role="status"
          aria-label="Loading"
        >
          <Loader2 className="h-4 w-4 animate-spin text-[#1900FF]" />
          <span className="text-xs font-medium text-slate-500">
            Loading&hellip;
          </span>
        </div>
      </div>

      <div className="animate-pulse space-y-8">
        {showHeader && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-10 w-72 rounded-xl" />
          </div>
        )}

        {showPills && (
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-11 w-52 rounded-full" />
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        )}

        {showStats > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(showStats)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-3xl" />
            ))}
          </div>
        )}

        {showGrid && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-3xl" />
            ))}
          </div>
        )}

        {showTable && <Skeleton className="h-[360px] w-full rounded-3xl" />}

        {showCards > 0 && (
          <div className="space-y-6">
            {[...Array(showCards)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-3xl" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}