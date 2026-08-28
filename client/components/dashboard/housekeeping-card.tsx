import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { housekeeping } from "@/utils/dashboard.data";

const HousekeepingCard = () => {
  const total =
    housekeeping.clean +
    housekeeping.cleaning +
    housekeeping.inspected +
    housekeeping.maintenance;

  const cleanPercentage =
    (housekeeping.clean / total) * 100;

  return (
    <section className="border border-[#E8E8E8] bg-white p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8787]">
            Housekeeping
          </p>

          <h2 className="mt-2 text-lg font-bold tracking-tight text-[#0C0332]">
            Room readiness
          </h2>
        </div>

        <span className="flex h-8 w-8 items-center justify-center bg-[#FFF8E8] text-[#A86B00]">
          <Sparkles size={14} />
        </span>
      </div>

      <div className="mt-7">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold tracking-tight text-[#0C0332]">
              {cleanPercentage.toFixed(0)}%
            </span>

            <p className="mt-1 text-[10px] text-[#8A8787]">
              rooms ready
            </p>
          </div>

          <span className="text-xs font-bold text-[#16834D]">
            {housekeeping.clean} clean
          </span>
        </div>

        <div className="mt-4 h-2 bg-[#F1F0F0]">
          <div
            className="h-full bg-[#16834D]"
            style={{ width: `${cleanPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#EFEFEF] pt-5">
        <div>
          <p className="text-[9px] text-[#8A8787]">
            Cleaning
          </p>

          <p className="mt-1 text-sm font-bold text-[#0C0332]">
            {housekeeping.cleaning}
          </p>
        </div>

        <div>
          <p className="text-[9px] text-[#8A8787]">
            Inspected
          </p>

          <p className="mt-1 text-sm font-bold text-[#0C0332]">
            {housekeeping.inspected}
          </p>
        </div>

        <div>
          <p className="text-[9px] text-[#8A8787]">
            Issues
          </p>

          <p className="mt-1 text-sm font-bold text-[#D62F2F]">
            {housekeeping.maintenance}
          </p>
        </div>
      </div>

      <Link
        href="/housekeeping"
        className="mt-6 flex items-center justify-between border-t border-[#EFEFEF] pt-4 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1900FF]"
      >
        Open housekeeping
        <ArrowRight size={12} />
      </Link>
    </section>
  );
};

export default HousekeepingCard;
