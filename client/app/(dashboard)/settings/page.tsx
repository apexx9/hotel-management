"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import RoomsService from "@/services/rooms.service";
import ServicesService from "@/services/services.service";

export default function SettingsPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsService, servicesService] = [RoomsService(), ServicesService()];
        const [roomTypesData, servicesData] = await Promise.all([
          roomsService.getRoomTypes(),
          servicesService.getServices(),
        ]);
        setRoomTypes(roomTypesData);
        setServices(servicesData);
      } catch (err) {
        console.error("Failed to load settings data:", err);
        setError("Failed to load settings data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Hotel configuration"
        description="Adjust hotel-level preferences without exposing admin-only controls to unauthorized users."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading settings data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard eyebrow="Property" title="Hotel profile">
              <div className="space-y-3 text-[12px] text-[#6B6B6B]">
                <div className="rounded-2xl bg-[#FBFBFC] p-4">Hotel information, address, and branding</div>
                <div className="rounded-2xl bg-[#FBFBFC] p-4">Payment methods and operational rules</div>
                <div className="rounded-2xl bg-[#FBFBFC] p-4">Taxes, fees, and invoice preferences</div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Access" title="Role-controlled settings">
              <div className="space-y-3">
                {[
                  "Staff and role management",
                  "Room status and maintenance controls",
                  "Service catalog and pricing",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    {item}
                  </div>
                ))}
                <StatusChip label="restricted" tone="warning" />
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard eyebrow="Room types" title="Configured room types">
              <div className="space-y-3">
                {roomTypes.length > 0 ? roomTypes.map((roomType) => (
                  <div key={roomType.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[13px] font-bold text-[#0C0332]">{roomType.name}</p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">{roomType.description}</p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">{formatCurrency(Number(roomType.basePrice))}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No room types configured.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Services" title="Available hotel services">
              <div className="space-y-3">
                {services.length > 0 ? services.map((service) => (
                  <div key={service.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[13px] font-bold text-[#0C0332]">{service.name}</p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">{service.category}</p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">{formatCurrency(Number(service.price))}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No services configured.
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

