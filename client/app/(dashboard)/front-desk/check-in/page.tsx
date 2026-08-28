"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ClipboardCheck, Search, CheckCircle2, UserCheck } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import Button from "@/components/button";
import { formatCurrency } from "@/utils/hms.data";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import { DashboardStaySummary } from "@/actions/operations";
import { toast } from "sonner";

export default function CheckInPage() {
  const router = useRouter();
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStay, setSelectedStay] = useState<DashboardStaySummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const staysService = StaysService();
      const staysData = await staysService.getStays();
      // Filter for arrivals or reserved
      const pendingArrivals = staysData.filter(
        (stay) => stay.status === "pending_arrival" || stay.status === "reserved"
      );
      setStays(pendingArrivals);
      if (pendingArrivals.length > 0) {
        setSelectedStay(pendingArrivals[0]);
      } else {
        setSelectedStay(null);
      }
    } catch (err) {
      console.error("Failed to load check-in data:", err);
      setError("Failed to load pending arrivals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredArrivals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stays;
    return stays.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        (s.guestName && s.guestName.toLowerCase().includes(q)) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q))
    );
  }, [stays, searchQuery]);

  const handleCheckIn = async (stayId: string) => {
    setIsProcessing(true);
    try {
      const bookingsService = BookingsService();
      await bookingsService.checkIn({ stayId });
      toast.success("Guest checked in successfully! Room status marked occupied.");
      await loadData();
    } catch (err) {
      console.error("Failed to check in:", err);
      toast.error("Failed to complete check-in. Please ensure room is available.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk"
        title="Check-in"
        description="Verify guest identity, confirm room assignment, and activate the stay."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading check-in queue...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard eyebrow="Lookup" title="Arrivals queue">
              <div className="flex items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3">
                <Search size={16} className="text-[#8A8787]" />
                <input
                  type="text"
                  placeholder="Search by guest name, stay reference, or room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#A19F9F]"
                />
              </div>

              <div className="mt-4 space-y-3">
                {filteredArrivals.length > 0 ? (
                  filteredArrivals.map((stay) => {
                    const isSelected = selectedStay?.id === stay.id;
                    return (
                      <div
                        key={stay.id}
                        onClick={() => setSelectedStay(stay)}
                        className={`cursor-pointer rounded-2xl p-4 transition-all ${
                          isSelected
                            ? "border-2 border-[#1900FF] bg-[#F7F7FF]"
                            : "border border-[#E8E8E8] bg-[#FBFBFC] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#0C0332]">
                              {stay.guestName || "Guest"}
                            </p>
                            <p className="mt-1 text-[12px] text-[#6B6B6B]">
                              Stay {stay.reference} · Room {stay.roomNumber || "Unassigned"} · {stay.roomTypeName || "Room"}
                            </p>
                            <p className="text-[11px] text-[#8A8787] mt-0.5">
                              {stay.nights} night(s) · Expected checkout: {new Date(stay.expectedCheckoutAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusChip
                            label={stay.status.replace("_", " ")}
                            tone={stay.status === "reserved" ? "neutral" : "info"}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-8 text-center text-[13px] text-[#6B6B6B]">
                    No pending arrivals waiting for check-in.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Checklist" title="Check-in verification standards">
              <div className="space-y-3 text-[12px] text-[#6B6B6B]">
                {[
                  "Verify guest identity document (Passport / National ID)",
                  "Confirm room readiness (Must be available / reserved)",
                  "Collect initial payment or verify payment method",
                  "Review stay duration, special requests, and room key",
                  "Explain hotel amenities, Wi-Fi, and check-out time (11:00 AM)",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#FBFBFC] p-4">
                    <ClipboardCheck size={14} className="text-[#1900FF] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard eyebrow="Guest details" title="Identity record">
              <div className="space-y-3">
                {selectedStay ? (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Guest name
                      </p>
                      <p className="mt-1 text-[14px] font-bold text-[#0C0332]">
                        {selectedStay.guestName || "Guest"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Phone number
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-[#0C0332]">
                        {selectedStay.guestPhone || "Not provided"}
                      </p>
                    </div>
                    {selectedStay.guestEmail && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                          Email address
                        </p>
                        <p className="mt-1 text-[13px] text-[#0C0332]">
                          {selectedStay.guestEmail}
                        </p>
                      </div>
                    )}
                    <div className="pt-2">
                      <StatusChip label="Identity verified" tone="success" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    Select a stay to view guest details.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Room & financial" title="Stay overview">
              <div className="space-y-3">
                {selectedStay ? (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#EDEDED]">
                      <span className="text-[#8A8787]">Assigned room</span>
                      <span className="font-bold text-[#0C0332]">Room {selectedStay.roomNumber || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EDEDED]">
                      <span className="text-[#8A8787]">Category</span>
                      <span className="font-semibold text-[#0C0332]">{selectedStay.roomTypeName || "Standard"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EDEDED]">
                      <span className="text-[#8A8787]">Duration</span>
                      <span className="font-semibold text-[#0C0332]">{selectedStay.nights} night(s)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EDEDED]">
                      <span className="text-[#8A8787]">Total charge</span>
                      <span className="font-bold text-[#0C0332]">{formatCurrency(Number(selectedStay.total))}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#EDEDED]">
                      <span className="text-[#8A8787]">Amount paid</span>
                      <span className="font-semibold text-[#0C0332]">{formatCurrency(Number(selectedStay.amountPaid))}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#8A8787]">Outstanding</span>
                      <span className="font-bold text-[#1900FF]">{formatCurrency(Number(selectedStay.outstandingBalance))}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    Select a stay to review financial overview.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Action" title="Complete check-in">
              <div className="space-y-4">
                {selectedStay ? (
                  <>
                    <div className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[13px] font-bold text-[#0C0332]">
                        Ready to check in
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        {selectedStay.guestName} into Room {selectedStay.roomNumber}.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      text={isProcessing ? "Processing check-in..." : "Complete check-in"}
                      disabled={isProcessing}
                      onClick={() => handleCheckIn(selectedStay.id)}
                    />

                    <div className="flex items-center gap-2 text-[12px] text-[#6B6B6B] pt-2">
                      <CalendarCheck size={14} className="text-[#1900FF]" />
                      <span>Stay state changes to Active and room becomes Occupied.</span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    Select an arrival from the queue above to proceed.
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
