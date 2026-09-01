import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { DashboardStaySummary } from "../../../client/actions/operations";

interface DeparturesPanelProps {
  departures: DashboardStaySummary[];
}

function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function DeparturesPanel({
  departures,
}: DeparturesPanelProps) {
  return (
    <section className="border bg-white">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Departures
          </p>

          <h2 className="mt-1 text-sm font-semibold text-[#0C0332]">
            Today&apos;s departures
          </h2>
        </div>

        <Link
          href="/front-desk"
          className="flex items-center gap-1 text-[11px] font-medium text-[#1900FF]"
        >
          View all
          <ArrowUpRight size={12} />
        </Link>
      </div>

      <div>
        {departures.length === 0 ? (
          <div className="px-5 py-12 text-center text-xs text-zinc-400">
            No departures scheduled for today.
          </div>
        ) : (
          departures.slice(0, 6).map((stay) => {
            const balance = Number(stay.outstandingBalance || 0);

            return (
              <div
                key={stay.id}
                className="grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock size={13} />
                  {formatTime(stay.expectedCheckoutAt)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {stay.guestName || "Unnamed guest"}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-400">
                    Room {stay.roomNumber || "—"} · {stay.reference}
                  </p>
                </div>

                <div className="text-right">
                  {balance > 0 ? (
                    <>
                      <p className="text-[11px] font-semibold text-red-600">
                        Balance due
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {balance.toLocaleString("en-GH", {
                          style: "currency",
                          currency: "GHS",
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] font-medium text-emerald-600">
                      Paid
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
