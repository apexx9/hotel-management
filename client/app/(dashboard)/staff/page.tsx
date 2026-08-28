"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";

export default function StaffPage() {
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Staff data would come from the auth/users system
        // For now, we'll set empty array until we have a staff/users endpoint
        setStaffMembers([]);
      } catch (err) {
        console.error("Failed to load staff data:", err);
        setError("Failed to load staff data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Staff management"
        description="View hotel staff, their roles, and their recent operational activity."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading staff data...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <SectionCard eyebrow="Team" title="Current staff">
            <div className="space-y-3">
              {staffMembers.length > 0 ? staffMembers.map((staff) => (
                <div key={staff.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[#0C0332]">{staff.name}</p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        {staff.role} · {staff.assignedArea}
                      </p>
                    </div>
                    <StatusChip label={staff.status} tone={staff.status === "active" ? "success" : "neutral"} />
                  </div>
                  <p className="mt-3 text-[12px] text-[#6B6B6B]">{staff.lastAction}</p>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                  Staff data will be loaded from the users/auth system.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Permissions" title="Invitation flow">
            <div className="space-y-3 text-[12px] text-[#6B6B6B]">
              <p className="rounded-2xl bg-[#FBFBFC] p-4">
                Staff accounts should continue using the current invitation-based authentication architecture.
              </p>
              <p className="rounded-2xl bg-[#FBFBFC] p-4">
                Roles control permissions for admin, manager, front desk, housekeeping, finance, and service staff.
              </p>
              <StatusChip label="auth unchanged" tone="info" />
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

