import { BedDouble, CalendarCheck, LogIn, LogOut } from "lucide-react";

type StatIcon = "occupancy" | "rooms" | "check-in" | "check-out";

interface StatCardProps {
  label: string;
  value: number | string;
  comparison: string;
  comparisonLabel: string;
  icon: StatIcon;
}

const icons = {
  occupancy: BedDouble,
  rooms: BedDouble,
  "check-in": LogIn,
  "check-out": LogOut,
};

const StatCard = ({ label, value, comparison, comparisonLabel, icon }: StatCardProps) => {
  const Icon = icons[icon];

  return (
    <article className="group rounded-2xl border border-[#E8E8E8]/70 bg-white p-5.5 transition-all duration-300 ease-out hover:border-[#DCD9FF] hover:shadow-[0_8px_32px_rgba(12,3,50,0.03)] p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F7FF] text-[#1900FF]">
          <Icon size={18} strokeWidth={1.8} />
        </div>

        {icon === "occupancy" && (
          <span className="rounded-full bg-[#F0FAF4] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#16834D]">
            Healthy
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="text-[13px] font-medium text-[#8A8787] mb-1">
          {label}
        </p>

        <div className="flex items-baseline gap-2">
          <p className="text-[28px] font-bold tracking-tight text-[#0C0332]">
            {value}
            {icon === "occupancy" && <span className="text-xl text-[#0C0332]/80">%</span>}
          </p>
        </div>

        <p className="mt-2 text-[11px] font-medium text-[#8A8787]">
          <span className="font-bold text-[#1900FF]">
            {comparison}
          </span>{" "}
          {comparisonLabel}
        </p>
      </div>
    </article>
  );
};

export default StatCard;
