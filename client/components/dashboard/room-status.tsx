import { roomRevenueByType } from "@/utils/dashboard.data";

export default function RoomStatusAndRevenue() {
  return (
    <section className="flex flex-col border border-[#E8E8E8] bg-white h-full">
      <div className="flex items-center justify-between border-b border-[#E8E8E8] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787]">Inventory & Revenue Yield</h3>
        <div className="flex gap-2">
          {["All", "Available", "Occupied"].map((status, i) => (
            <button key={status} className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 ${i === 0 ? "text-[#1900FF]" : "text-[#A19F9F]"}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E8E8E8] flex-1">
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-end gap-4">
            <span className="text-6xl font-bold tracking-tighter text-[#0C0332]">120</span>
            <span className="text-[12px] font-bold text-[#A19F9F] mb-2 uppercase tracking-widest">/ 128 Total Occupied</span>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <p className="text-[13px] font-medium text-[#6B6B6B]">
              <strong className="text-[#0C0332]">6</strong> rooms turning over tonight
            </p>
            <p className="text-[13px] font-medium text-[#6B6B6B]">
              <strong className="text-[#0C0332]">14</strong> check-ins remaining
            </p>
          </div>
        </div>

        <div className="p-8 flex flex-col justify-center gap-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787] mb-2">Revenue by Room Type</p>
          {roomRevenueByType.map((item) => (
            <div key={item.type} className="flex items-center gap-4">
              <span className="w-16 text-[11px] font-bold text-[#0C0332]">{item.type}</span>
              <div className="flex-1 h-1.5 bg-[#F4F4F4] overflow-hidden">
                <div
                  className={`h-full ${item.type === "Suite" ? "bg-[#1900FF]" : "bg-[#D1D1D1]"}`}
                  style={{ width: `${(item.revenue / item.max) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-[12px] font-bold text-[#0C0332]">₵{item.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
