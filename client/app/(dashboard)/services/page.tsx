"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import ServicesService from "@/services/services.service";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [stays, setStays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const servicesService = ServicesService();
        const servicesData = await servicesService.getServices();
        setServices(servicesData);
        // Stays would need to be loaded from a stays service
        setStays([]);
      } catch (err) {
        console.error("Failed to load services data:", err);
        setError("Failed to load services data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Services"
        title="Hotel service catalog"
        description="Manage chargeable services and attach them to active stays."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading service data...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionCard eyebrow="Catalog" title="Active services">
            <div className="space-y-3">
              {services.length > 0 ? services.map((service) => (
                <div key={service.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[#0C0332]">
                        {service.name}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        {service.category} · {service.description}
                      </p>
                    </div>
                    <StatusChip label={formatCurrency(Number(service.price))} tone={service.isActive ? "success" : "neutral"} />
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                  No services configured.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Charge queue" title="Attach services to active stays">
            <div className="space-y-3">
              {stays.length > 0 ? stays.filter((stay) => stay.status === "checked_in").map((stay) => (
                <div key={stay.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                  <p className="text-[13px] font-bold text-[#0C0332]">
                    Guest {stay.guestId} · Room {stay.roomId}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B6B6B]">
                    Stay {stay.id} · Balance {formatCurrency(Number(stay.outstandingBalance) || 0)}
                  </p>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                  No active stays found.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

