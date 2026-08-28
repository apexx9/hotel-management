import Link from "next/link";
import {
  ArrowUpRight,
  CalendarPlus,
  LogIn,
  LogOut,
  Search,
} from "lucide-react";

const actions = [
  {
    label: "New booking",
    href: "/reservations/new",
    icon: CalendarPlus,
  },
  {
    label: "Check in",
    href: "/front-desk/check-in",
    icon: LogIn,
  },
  {
    label: "Check out",
    href: "/front-desk/check-out",
    icon: LogOut,
  },
  {
    label: "Find guest",
    href: "/guests",
    icon: Search,
  },
];

const QuickActions = () => {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A8787]">
          Quick actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center justify-between border border-[#E8E8E8] bg-white px-4 py-3.5 transition-all duration-200 hover:border-[#DCD9FF] hover:shadow-[0_8px_24px_rgba(12,3,50,0.04)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center bg-[#F7F7FF] text-[#1900FF]">
                  <Icon size={15} strokeWidth={1.8} />
                </span>

                <span className="text-xs font-bold text-[#0C0332]">
                  {action.label}
                </span>
              </div>

              <ArrowUpRight
                size={14}
                className="text-[#B4B2B2] transition-colors group-hover:text-[#1900FF]"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default QuickActions;
