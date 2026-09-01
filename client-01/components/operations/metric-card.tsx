import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
}

const MetricCard = ({ label, value, detail, icon: Icon }: MetricCardProps) => {
  return (
    <article className="rounded-2xl border border-[#E8E8E8] bg-white p-5 transition-all duration-200 hover:border-[#DCD9FF] hover:shadow-[0_8px_24px_rgba(12,3,50,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
            {label}
          </p>
          <p className="mt-2 text-[28px] font-bold tracking-tight text-[#0C0332]">
            {value}
          </p>
          {detail && (
            <p className="mt-1 text-[12px] font-medium leading-6 text-[#6B6B6B]">
              {detail}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7F7FF] text-[#1900FF]">
          <Icon size={18} strokeWidth={1.9} />
        </div>
      </div>
    </article>
  );
};

export default MetricCard;

