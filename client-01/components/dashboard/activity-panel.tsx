import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { DashboardActivityItem } from "../../../client/actions/operations";

interface ActivityPanelProps {
  activities: DashboardActivityItem[];
}

function formatRelativeTime(value: string | Date) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

export default function ActivityPanel({
  activities,
}: ActivityPanelProps) {
  return (
    <section className="border bg-white">
      <div className="flex items-start justify-between border-b px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
            Activity
          </p>

          <h2 className="mt-1 text-sm font-semibold text-[#0C0332]">
            Recent activity
          </h2>
        </div>

        <Link
          href="/operations"
          className="flex items-center gap-1 text-[11px] font-medium text-[#1900FF]"
        >
          View all
          <ArrowUpRight size={12} />
        </Link>
      </div>

      <div>
        {activities.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs text-zinc-400">
            No recent activity.
          </div>
        ) : (
          activities.slice(0, 7).map((activity) => (
            <div
              key={activity.id}
              className="flex gap-4 border-b px-5 py-3.5 last:border-b-0"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-[#1900FF]" />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-medium text-zinc-900">
                    {activity.event}
                  </p>

                  <span className="shrink-0 text-[10px] text-zinc-400">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>

                {activity.description && (
                  <p className="mt-1 text-[11px] leading-4 text-zinc-400">
                    {activity.description}
                  </p>
                )}

                {activity.actorName && (
                  <p className="mt-1.5 text-[10px] text-zinc-400">
                    by {activity.actorName}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
