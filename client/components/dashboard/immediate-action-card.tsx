import Link from "next/link";
import { ArrowRight, Clock3, LucideIcon } from "lucide-react";

interface ImmediateActionCardProps {
  type: "arrival" | "departure";
  guest: string;
  room: string;
  time: string;
  roomType?: string;
  icon: LucideIcon;
}

export default function ImmediateActionCard({
  type,
  guest,
  room,
  time,
  roomType,
  icon: Icon,
}: ImmediateActionCardProps) {
  return (
    <section className="group relative flex h-[calc(50%-12px)] min-h-[180px] flex-col justify-between border border-[#E8E8E8] bg-white p-6 transition-all duration-400 ease-out hover:border-[#1900FF]/30 hover:shadow-[0_8px_30px_rgba(12,3,50,0.04)]">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8A8787]">
            Next {type}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[#A19F9F]">Today</p>
        </div>

        {/* The icon block inverses on hover for a tactile, premium feel */}
        <span className="flex h-9 w-9 items-center justify-center bg-[#F7F7FF] text-[#1900FF] transition-colors duration-300 group-hover:bg-[#1900FF] group-hover:text-white">
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>

      <div className="mt-4">
        <p className="text-xl font-bold tracking-tight text-[#0C0332] truncate">
          {guest}
        </p>
        <p className="mt-1 text-[12px] font-medium text-[#6B6B6B]">
          Room {room} {roomType && <span className="opacity-40 mx-1.5">•</span>} {roomType}
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Clock3 size={14} className="text-[#1900FF]" strokeWidth={2.5} />
          <span className="text-[13px] font-bold tracking-wide text-[#0C0332]">{time}</span>
        </div>
      </div>

      <Link
        href="/front-desk"
        className="mt-6 flex items-center justify-between border-t border-[#EFEFEF] pt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1900FF] transition-colors hover:text-[#1200C9]"
      >
        Open front desk
        <ArrowRight
          size={14}
          className="transition-transform duration-300 ease-out group-hover:translate-x-1.5"
        />
      </Link>
    </section>
  );
}
