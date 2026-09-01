import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardSummaryResponse } from "../../../client/actions/operations";

interface HousekeepingPanelProps {
  housekeeping: DashboardSummaryResponse["housekeeping"];
}

export default function HousekeepingPanel({
  housekeeping,
}: HousekeepingPanelProps) {
  const total =
    housekeeping.cleaning +
    housekeeping.inspection +
    housekeeping.ready +
    housekeeping.maintenance;

  const items = [
    {
      label: "Cleaning",
      value: housekeeping.cleaning,
      className: "bg-amber-500",
    },
    {
      label: "Inspection",
      value: housekeeping.inspection,
      className: "bg-blue-500",
    },
    {
      label: "Ready",
      value: housekeeping.ready,
      className: "bg-emerald-500",
    },
    {
      label: "Maintenance",
      value: housekeeping.maintenance,
      className: "bg-red-500",
    },
  ];

  return (
    <section className="border bg-white">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Operations
          </p>

          <h2 className="mt-1 text-sm font-semibold text-[#0C0332]">
            Housekeeping
          </h2>
        </div>

        <Link
          href="/operations"
          className="flex items-center gap-1 text-[11px] font-medium text-[#1900FF]"
        >
          Open
          <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="px-5 py-5">
        <div className="mb-5 flex h-2 overflow-hidden bg-zinc-100">
          {items.map((item) => {
            const percentage =
              total > 0 ? (item.value / total) * 100 : 0;

            return (
              <div
                key={item.label}
                className={item.className}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] text-zinc-400">
                {item.label}
              </p>

              <p className="mt-1 text-lg font-semibold text-[#0C0332]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
