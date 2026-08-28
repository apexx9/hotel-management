import { UserRound } from "lucide-react";
import { todayArrivals } from "@/utils/dashboard.data";

export default function ArrivalsCard() {
  return (
    <section className="flex h-full flex-col border border-[#E8E8E8] bg-white">
      <div className="flex items-center justify-between border-b border-[#E8E8E8] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787] flex items-center gap-2">
          <UserRound size={14} /> Today&apos;s Arrivals
        </h3>
        <div className="flex gap-2">
          {["All", "Pending"].map((status, i) => (
            <button key={status} className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 transition-colors ${i === 0 ? "text-[#1900FF]" : "text-[#A19F9F] hover:text-[#0C0332]"}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 divide-y divide-[#F4F4F4] overflow-y-auto">
        {todayArrivals.map((arrival) => (
          <div key={arrival.id} className="flex items-center justify-between p-5 transition-colors hover:bg-[#F9F9F9]">
            <div>
              <p className="text-[13px] font-bold text-[#0C0332]">{arrival.guest}</p>
              <p className="mt-1 text-[11px] font-medium text-[#8A8787]">
                Room {arrival.room} <span className="mx-1 opacity-40">•</span> {arrival.type}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-bold text-[#0C0332]">{arrival.time}</p>
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${arrival.status === "Checked In" ? "text-[#1900FF]" : "text-[#A19F9F]"}`}>
                {arrival.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
