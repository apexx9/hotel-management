import { BedDouble, Circle } from "lucide-react";
import type { DashboardSummaryResponse } from "../../../client/actions/operations";

interface RoomStatusPanelProps {
  roomStatus: DashboardSummaryResponse["roomStatus"];
}

const items = [
  {
    key: "occupied",
    label: "Occupied",
  },
  {
    key: "available",
    label: "Available",
  },
  {
    key: "turningOver",
    label: "Turning over",
  },
] as const;

export default function RoomStatusPanel({
  roomStatus,
}: RoomStatusPanelProps) {
  const values = {
    occupied: roomStatus.occupied,
    available: roomStatus.available,
    turningOver: roomStatus.turningOver,
  };

  return (
    <section className="border bg-white">
      <div className="border-b px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Rooms
        </p>

        <div className="mt-1 flex items-end justify-between">
          <h2 className="text-sm font-semibold text-[#0C0332]">
            Room status
          </h2>

          <span className="text-xs text-zinc-400">
            {roomStatus.total} total
          </span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="flex items-center gap-5">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center border-8 border-[#1900FF]">
            <div className="text-center">
              <p className="text-xl font-semibold tracking-tight text-[#0C0332]">
                {roomStatus.occupancy}%
              </p>
              <p className="text-[9px] uppercase tracking-wider text-zinc-400">
                occupied
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between border-b py-2.5 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <Circle
                    size={7}
                    fill="currentColor"
                    className={
                      item.key === "occupied"
                        ? "text-[#1900FF]"
                        : item.key === "available"
                          ? "text-emerald-500"
                          : "text-amber-500"
                    }
                  />

                  <span className="text-xs text-zinc-600">
                    {item.label}
                  </span>
                </div>

                <span className="text-xs font-semibold text-zinc-900">
                  {values[item.key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2">
            <BedDouble size={15} className="text-zinc-400" />

            <span className="text-[11px] text-zinc-500">
              Check-ins remaining
            </span>
          </div>

          <span className="text-sm font-semibold text-[#0C0332]">
            {roomStatus.checkInsRemaining}
          </span>
        </div>
      </div>
    </section>
  );
}
