import { ArrowRight, Clock3, LogOut } from "lucide-react";
import Link from "next/link";

import { departures } from "@/utils/dashboard.data";

const NextDeparture = () => {
  const departure = departures[0];

  return (
    <section className="flex min-h-[245px] flex-col justify-between border border-[#E8E8E8] bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8787]">
            Next departure
          </p>

          <p className="mt-1 text-[11px] text-[#A19F9F]">
            Today
          </p>
        </div>

        <span className="flex h-8 w-8 items-center justify-center bg-[#F7F7FF] text-[#1900FF]">
          <LogOut size={15} />
        </span>
      </div>

      <div className="mt-8">
        <p className="text-xl font-bold tracking-tight text-[#0C0332]">
          {departure.guest}
        </p>

        <p className="mt-1 text-xs text-[#6B6B6B]">
          Room {departure.room}
        </p>

        <div className="mt-5 flex items-center gap-2">
          <Clock3 size={14} className="text-[#1900FF]" />

          <span className="text-sm font-bold text-[#0C0332]">
            {departure.time}
          </span>
        </div>
      </div>

      <Link
        href="/front-desk"
        className="mt-6 flex items-center justify-between border-t border-[#EFEFEF] pt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1900FF]"
      >
        Open front desk
        <ArrowRight size={13} />
      </Link>
    </section>
  );
};

export default NextDeparture;
