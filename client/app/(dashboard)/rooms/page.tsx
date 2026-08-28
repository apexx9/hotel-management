"use client";

import { useState, useEffect } from "react";
import { BedDouble, Search } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import RoomsService from "@/services/rooms.service";

export default function RoomsPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const roomsService = RoomsService();
        const [roomTypesData, roomsData] = await Promise.all([
          roomsService.getRoomTypes(),
          roomsService.getRooms(),
        ]);
        setRoomTypes(roomTypesData);
        setRooms(roomsData);
      } catch (err) {
        console.error("Failed to load rooms data:", err);
        setError("Failed to load rooms data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rooms"
        title="Room inventory"
        description="Monitor room status, room type, rate, and operational readiness."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading room data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <SectionCard eyebrow="Search" title="Filter rooms">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3">
              <Search size={16} className="text-[#8A8787]" />
              <input
                type="text"
                placeholder="Search room number, floor, type, or status"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#A19F9F]"
              />
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <SectionCard eyebrow="Room types" title="Configured categories">
              <div className="space-y-3">
                {roomTypes.length > 0 ? roomTypes.map((roomType) => (
                  <div key={roomType.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#0C0332]">
                          {roomType.name}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B6B6B]">
                          {roomType.description}
                        </p>
                      </div>
                      <StatusChip label={roomType.isActive ? "active" : "inactive"} tone={roomType.isActive ? "success" : "neutral"} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-[#6B6B6B]">
                      <span>Rate: {formatCurrency(Number(roomType.basePrice))}</span>
                      <span>Capacity: {roomType.capacity}</span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No room types configured.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Rooms" title="Current room status">
              <div className="grid gap-3 md:grid-cols-2">
                {rooms.length > 0 ? rooms.map((room) => (
                  <div key={room.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#0C0332]">
                          Room {room.number}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B6B6B]">
                          Floor {room.floor} · {formatCurrency(Number(room.rate))}
                        </p>
                      </div>
                      <StatusChip
                        label={room.status}
                        tone={
                          room.status === "available"
                            ? "success"
                            : room.status === "occupied"
                              ? "info"
                              : room.status === "maintenance" || room.status === "out_of_service"
                                ? "danger"
                                : "warning"
                        }
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <BedDouble size={14} className="text-[#1900FF]" />
                      <span className="text-[12px] text-[#6B6B6B]">
                        Capacity {room.capacity}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No rooms available.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
