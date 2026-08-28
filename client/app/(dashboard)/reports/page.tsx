"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import MetricCard from "@/components/operations/metric-card";
import { Banknote, BarChart3, BedDouble, Users } from "lucide-react";
import { formatCurrency } from "@/utils/hms.data";
import RoomsService from "@/services/rooms.service";
import PaymentsService from "@/services/payments.service";
import GuestsService from "@/services/guests.service";

export default function ReportsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsService, paymentsService, guestsService] = [
          RoomsService(),
          PaymentsService(),
          GuestsService(),
        ];
        const [roomsData, paymentsData, guestsData] = await Promise.all([
          roomsService.getRooms(),
          paymentsService.getPayments(),
          guestsService.getGuests(),
        ]);
        setRooms(roomsData);
        setPayments(paymentsData);
        setGuests(guestsData);
        // Stays would need to be loaded from a stays service
        setStays([]);
      } catch (err) {
        console.error("Failed to load reports data:", err);
        setError("Failed to load reports data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalRevenue = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
  const occupancyRate = rooms.length > 0 
    ? rooms.filter((room) => room.status === "occupied").length / rooms.length 
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Reports and analytics"
        description="Review revenue, occupancy, operational, guest, and staff performance trends."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading reports data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Revenue" value={formatCurrency(totalRevenue)} detail="Payments captured" icon={Banknote} />
            <MetricCard label="Occupancy" value={`${Math.round(occupancyRate * 100)}%`} detail="Rooms occupied" icon={BedDouble} />
            <MetricCard label="Active stays" value={stays.filter((stay) => stay.status === "checked_in").length.toString()} detail="Current in-house guests" icon={BarChart3} />
            <MetricCard label="Guest base" value={guests.length.toString()} detail="Guest profiles on file" icon={Users} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard eyebrow="Operational view" title="Daily performance">
              <div className="space-y-3 text-[12px] text-[#6B6B6B]">
                <div className="rounded-2xl bg-[#FBFBFC] p-4">
                  Reports will be populated from backend analytics endpoints.
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Trend" title="Simple occupancy bar view">
              <div className="flex h-60 items-end gap-3">
                {[45, 52, 61, 63, 72, 68, 75].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-52 w-full items-end">
                      <div className="w-full rounded-t-md bg-[#1900FF]" style={{ height: `${height}%` }} />
                    </div>
                    <span className="text-[10px] font-semibold text-[#A19F9F]">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}

