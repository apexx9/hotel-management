import { Activity } from "lucide-react";
import { recentActivity } from "@/utils/dashboard.data";

export default function RecentActivity() {
  return (
    <section className="flex h-full flex-col border border-[#E8E8E8] bg-white">
      <div className="flex items-center justify-between border-b border-[#E8E8E8] p-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787] flex items-center gap-2">
          <Activity size={14} /> System Activity
        </h3>
        <button className="text-[10px] font-bold tracking-widest uppercase text-[#1900FF] hover:text-[#0C0332] transition-colors">
          View All
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        {recentActivity.map((log, index) => (
          <div key={log.id} className="relative flex gap-4">
            {/* Timeline line */}
            {index !== recentActivity.length - 1 && (
              <div className="absolute left-[3px] top-[14px] bottom-[-24px] w-[2px] bg-[#F4F4F4]" />
            )}

            <div className="relative z-10 mt-1 h-2 w-2 rounded-full bg-[#1900FF] flex-shrink-0" />

            <div className="flex-1 flex justify-between items-start">
              <div>
                <p className="text-[13px] font-bold text-[#0C0332]">
                  {log.action} <span className="font-medium text-[#8A8787]">· {log.target}</span>
                </p>
                <p className="mt-1 text-[12px] font-medium text-[#6B6B6B]">{log.details}</p>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-[#A19F9F] uppercase whitespace-nowrap ml-4">
                {log.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
