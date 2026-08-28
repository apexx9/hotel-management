import { CalendarDays } from "lucide-react";

const DashboardHeader = () => {
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8787]">
          <CalendarDays size={13} strokeWidth={1.8} />
          <span>{date || "Loading date..."}</span>
        </div>

        <h1 className="mt-2.5 text-[28px] font-bold tracking-[-0.03em] text-[#0C0332]">
          Good morning, Kobby
        </h1>

        <p className="mt-1.5 text-sm font-medium leading-6 text-[#6B6B6B]">
          Here&apos;s what&apos;s happening across the property today.
        </p>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="h-8 w-px bg-[#E8E8E8]" />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A8787]">
            Property status
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#16834D]" />
            <span className="text-xs font-bold text-[#0C0332]">
              Operating normally
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
