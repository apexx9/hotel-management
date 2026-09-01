import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  CircleAlert,
} from "lucide-react";
import type { DashboardSummaryResponse } from "../../../client/actions/operations";

interface AttentionPanelProps {
  items: DashboardSummaryResponse["attentionItems"];
}

export default function AttentionPanel({
  items,
}: AttentionPanelProps) {
  return (
    <section className="border bg-white">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Attention
          </p>

          <h2 className="mt-1 text-sm font-semibold text-[#0C0332]">
            Requires attention
          </h2>
        </div>

        <span className="flex h-5 min-w-5 items-center justify-center bg-red-50 px-1.5 text-[10px] font-semibold text-red-600">
          {items.length}
        </span>
      </div>

      <div>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8">
            <div className="flex h-8 w-8 items-center justify-center bg-emerald-50">
              <CircleAlert
                size={15}
                className="text-emerald-600"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-800">
                Everything looks good
              </p>

              <p className="mt-1 text-[11px] text-zinc-400">
                No operational issues require attention.
              </p>
            </div>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href="/operations"
              className="flex gap-3 border-b px-5 py-4 transition-colors hover:bg-zinc-50 last:border-b-0"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-red-50">
                <AlertCircle
                  size={14}
                  className="text-red-500"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-900">
                  {item.title}
                </p>

                <p className="mt-1 text-[11px] leading-4 text-zinc-400">
                  {item.description}
                </p>
              </div>

              <ArrowUpRight
                size={13}
                className="mt-1 shrink-0 text-zinc-300"
              />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
