import { AlertCircle } from "lucide-react";
import { needsAttention } from "@/utils/dashboard.data";

export default function NeedsAttention() {
  return (
    <section className="flex flex-col border border-[#E8E8E8] bg-white h-full">
      <div className="p-6 border-b border-[#E8E8E8] bg-[#FDF9F9]">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D80000] flex items-center gap-2">
          <AlertCircle size={14} /> Needs Attention
        </h3>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        {needsAttention.map((item) => (
          <div key={item.id} className="relative pl-4 border-l-2 border-[#1900FF]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[13px] font-bold text-[#0C0332]">{item.title}</span>
              <span className="text-[10px] font-bold tracking-widest text-[#8A8787] uppercase">{item.time}</span>
            </div>
            <p className="text-[12px] font-medium text-[#6B6B6B] leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
