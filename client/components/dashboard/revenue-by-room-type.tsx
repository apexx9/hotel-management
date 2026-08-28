import { ArrowUpRight } from "lucide-react";

import { revenueByRoomType } from "@/utils/dashboard.data";

const RevenueByRoomType = () => {
  return (
    <section className="border border-[#E8E8E8] bg-white p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8787]">
            Revenue by room type
          </p>

          <h2 className="mt-2 text-lg font-bold tracking-tight text-[#0C0332]">
            Room performance
          </h2>
        </div>

        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#16834D]">
          <ArrowUpRight size={12} />
          +12.4%
        </span>
      </div>

      <div className="mt-7 space-y-5">
        {revenueByRoomType.map((room: { type: string; revenue: number; max: number; percentage: number }, index: number) => (
          <div key={room.type}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6B6B6B]">
                {room.type}
              </span>

              <span className="text-xs font-bold text-[#0C0332]">
                ₵{room.revenue.toLocaleString()}
              </span>
            </div>

            <div className="mt-2 h-1.5 bg-[#F1F0F0]">
              <div
                className={`h-full ${
                  index === 0
                    ? "bg-[#1900FF]"
                    : "bg-[#C8C4FF]"
                }`}
                style={{
                  width: `${room.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RevenueByRoomType;
