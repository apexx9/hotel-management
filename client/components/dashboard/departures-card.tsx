import { LogOut } from "lucide-react";
import { todayDepartures } from "@/utils/dashboard.data";

export default function DeparturesCard() {
  return (
    <section className="flex h-full flex-col border border-[#E8E8E8] bg-white">
      <div className="flex items-center justify-between border-b border-[#E8E8E8] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787] flex items-center gap-2">
          <LogOut size={14} /> Today&apos;s Departures
        </h3>
      </div>

      <div className="flex-1 divide-y divide-[#F4F4F4] overflow-y-auto">
        {todayDepartures.map((departure) => (
          <div key={departure.id} className="flex items-center justify-between p-5 transition-colors hover:bg-[#F9F9F9]">
            <div>
              <p className="text-[13px] font-bold text-[#0C0332]">{departure.guest}</p>
              <p className="mt-1 text-[11px] font-medium text-[#8A8787]">Room {departure.room}</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-bold text-[#0C0332]">{departure.time}</p>
              <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${departure.status === "Checked Out" ? "text-[#1900FF]" : "text-[#A19F9F]"}`}>
                {departure.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
