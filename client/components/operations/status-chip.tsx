interface StatusChipProps {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}

const toneClasses: Record<NonNullable<StatusChipProps["tone"]>, string> = {
  neutral: "bg-[#F4F4F4] text-[#6B6B6B]",
  success: "bg-[#EAF8EF] text-[#16834D]",
  warning: "bg-[#FFF7E6] text-[#B76E00]",
  danger: "bg-[#FDECEC] text-[#C1382A]",
  info: "bg-[#EEF2FF] text-[#1900FF]",
};

const StatusChip = ({ label, tone = "neutral" }: StatusChipProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
};

export default StatusChip;

