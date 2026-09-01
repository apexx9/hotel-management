import type { DashboardSummaryResponse } from "../../../client/actions/operations";
import {
  ArrowDownRight,
  ArrowUpRight,
  BedDouble,
  CalendarCheck,
  LogIn,
  LogOut,
  Wallet,
} from "lucide-react";

interface DashboardMetricsProps {
  stats: DashboardSummaryResponse["dashboardStats"];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  positive,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <div className="border-r border-zinc-200 px-5 py-5 last:border-r-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400">
          {label}
        </span>

        <Icon size={16} strokeWidth={1.7} className="text-zinc-300" />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <span className="text-[26px] font-semibold tracking-[-0.04em] text-[#0C0332]">
          {value}
        </span>

        <span
          className={[
            "mb-1 flex items-center gap-1 text-[11px]",
            positive === true
              ? "text-emerald-600"
              : positive === false
                ? "text-red-500"
                : "text-zinc-400",
          ].join(" ")}
        >
          {positive === true && <ArrowUpRight size={12} />}
          {positive === false && <ArrowDownRight size={12} />}
          {detail}
        </span>
      </div>
    </div>
  );
}

export default function DashboardMetrics({
  stats,
}: DashboardMetricsProps) {
  return (
    <section className="grid border-b bg-white md:grid-cols-2 xl:grid-cols-5">
      <Metric
        label="Occupancy"
        value={`${stats.occupancy}%`}
        detail={`${stats.occupiedRooms}/${stats.totalRooms} rooms`}
        icon={BedDouble}
        positive={stats.occupancy >= 60}
      />

      <Metric
        label="Revenue today"
        value={formatCurrency(stats.revenueCollectedToday)}
        detail={`Projected ${formatCurrency(stats.projectedEndOfDayRevenue)}`}
        icon={Wallet}
      />

      <Metric
        label="Average daily rate"
        value={formatCurrency(stats.averageDailyRate)}
        detail={`RevPAR ${formatCurrency(stats.revPar)}`}
        icon={CalendarCheck}
      />

      <Metric
        label="Arrivals"
        value={String(stats.todayCheckIns)}
        detail="Expected today"
        icon={LogIn}
      />

      <Metric
        label="Departures"
        value={String(stats.todayCheckOuts)}
        detail="Expected today"
        icon={LogOut}
      />
    </section>
  );
}
