"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, Search, Sparkles, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import Button from "@/components/button";
import { formatCurrency } from "@/utils/hms.data";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import { DashboardStaySummary } from "@/actions/operations";
import { toast } from "sonner";

export default function CheckOutPage() {
  const router = useRouter();
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStay, setSelectedStay] = useState<DashboardStaySummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overrideBalance, setOverrideBalance] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const staysService = StaysService();
      const activeStays = await staysService.getActiveStays();
      setStays(activeStays);
      if (activeStays.length > 0) {
        setSelectedStay(activeStays[0]);
        setAmountPaid(String(Math.max(0, Number(activeStays[0].outstandingBalance) || 0)));
      } else {
        setSelectedStay(null);
        setAmountPaid("");
      }
    } catch (err) {
      console.error("Failed to load active stays:", err);
      setError("Failed to load active stays from backend");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return stays;
    return stays.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        (s.guestName && s.guestName.toLowerCase().includes(q)) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q))
    );
  }, [stays, searchQuery]);

  const handleSelectStay = (stay: DashboardStaySummary) => {
    setSelectedStay(stay);
    setAmountPaid(String(Math.max(0, Number(stay.outstandingBalance) || 0)));
    setOverrideBalance(false);
  };

  const handleCheckOut = async () => {
    if (!selectedStay) return;

    const outstanding = Number(selectedStay.outstandingBalance) || 0;
    const payment = Number(amountPaid) || 0;
    const remaining = outstanding - payment;

    if (remaining > 0 && !overrideBalance) {
      toast.error(
        `Outstanding balance of ${formatCurrency(remaining)} must be paid or authorized with an override.`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      const bookingsService = BookingsService();
      const checkoutData: any = {
        stayId: selectedStay.id,
        overrideBalance,
      };

      if (payment > 0) {
        checkoutData.amountPaid = payment;
        checkoutData.paymentMethod = paymentMethod;
      }

      await bookingsService.checkOut(checkoutData);
      toast.success(
        `Stay ${selectedStay.reference} checked out. Room ${selectedStay.roomNumber || ""} sent to housekeeping!`,
      );
      await loadData();
    } catch (err: any) {
      console.error("Failed to check out:", err);
      const msg = err.response?.data?.message || err.message || "Failed to complete check-out";
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const outstanding = Number(selectedStay?.outstandingBalance) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk"
        title="Check-out"
        description="Review all room and service charges, collect outstanding balances, and close out the stay."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading in-house active guests...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <SectionCard eyebrow="In-house guests" title="Active stays on property">
              <div className="flex items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3">
                <Search size={16} className="text-[#8A8787]" />
                <input
                  type="text"
                  placeholder="Search by guest, stay reference, or room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#A19F9F]"
                />
              </div>

              <div className="mt-4 space-y-3">
                {filteredStays.length > 0 ? (
                  filteredStays.map((stay) => {
                    const isSelected = selectedStay?.id === stay.id;
                    const stayBalance = Number(stay.outstandingBalance) || 0;
                    return (
                      <div
                        key={stay.id}
                        className={`cursor-pointer rounded-2xl p-4 transition-all ${
                          isSelected
                            ? "border-2 border-[#1900FF] bg-[#F7F7FF]"
                            : "border border-[#E8E8E8] bg-[#FBFBFC] hover:bg-white"
                        }`}
                        onClick={() => handleSelectStay(stay)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#0C0332]">
                              {stay.guestName || "Guest"}
                            </p>
                            <p className="mt-1 text-[12px] text-[#6B6B6B]">
                              Stay {stay.reference} · Room {stay.roomNumber || "N/A"} · {stay.roomTypeName || "Room"}
                            </p>
                            <p className="text-[11px] text-[#8A8787] mt-0.5">
                              Check-in: {stay.checkInAt ? new Date(stay.checkInAt).toLocaleDateString() : "Active"} · Expected checkout: {new Date(stay.expectedCheckoutAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusChip
                            label={stayBalance > 0 ? `${formatCurrency(stayBalance)} due` : "settled"}
                            tone={stayBalance > 0 ? "warning" : "success"}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-8 text-center text-[13px] text-[#6B6B6B]">
                    No active stays currently eligible for checkout.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Checklist" title="Departure procedure">
              <div className="space-y-3 text-[12px] text-[#6B6B6B]">
                {[
                  "Review room rate and added service charges",
                  "Collect room key and verify room contents",
                  "Collect remaining outstanding balance or record payment",
                  "Issue final receipt / paid invoice to guest",
                  "Room automatically transitions to cleaning for housekeeping",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-[#FBFBFC] p-4">
                    <CheckCircle2 size={14} className="text-[#1900FF] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {selectedStay ? (
            <div className="grid gap-6 xl:grid-cols-3">
              <SectionCard
                eyebrow="Financial folio"
                title={`${selectedStay.guestName || "Guest"} · Room ${selectedStay.roomNumber || "N/A"}`}
                description={`Stay ${selectedStay.reference}`}
              >
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Total charges (Room + Services + Taxes)
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#0C0332]">
                      {formatCurrency(Number(selectedStay.total) || 0)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#6B6B6B]">
                      Room: {formatCurrency(Number(selectedStay.rate) * selectedStay.nights)} · Services: {formatCurrency(Number(selectedStay.serviceTotal) || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Total amount paid to date
                    </p>
                    <p className="mt-2 text-xl font-bold text-[#0C0332]">
                      {formatCurrency(Number(selectedStay.amountPaid) || 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Outstanding balance
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1900FF]">
                      {formatCurrency(outstanding)}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard eyebrow="Settlement" title="Payment on departure">
                <div className="space-y-4">
                  {outstanding > 0 ? (
                    <>
                      <div className="rounded-2xl bg-[#FFFDFD] border border-[#F3D3D3] p-4">
                        <div className="flex items-center gap-2 text-[#B42318] text-xs font-bold">
                          <AlertTriangle size={14} />
                          <span>Balance remaining: {formatCurrency(outstanding)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#6B6B6B]">
                          Enter payment details below to settle before completing checkout.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#0C0332]">Payment method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#E8E8E8] bg-[#FBFBFC] px-3 py-2.5 text-xs font-semibold text-[#0C0332] outline-none"
                        >
                          <option value="cash">Cash</option>
                          <option value="mobile_money">Mobile money</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#0C0332]">Payment amount (GHS)</label>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-[#E8E8E8] bg-[#FBFBFC] px-3 py-2.5 text-xs font-semibold text-[#0C0332] outline-none"
                          placeholder="Amount to settle"
                        />
                      </div>

                      <div className="rounded-2xl bg-[#FBFBFC] p-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#0C0332] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overrideBalance}
                            onChange={(e) => setOverrideBalance(e.target.checked)}
                            className="rounded border-[#E8E8E8] text-[#1900FF]"
                          />
                          <span>Authorize checkout with unsettled balance</span>
                        </label>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl bg-[#F7F7FF] border border-[#E8E8E8] p-4 text-center">
                      <CheckCircle2 size={24} className="mx-auto text-[#1900FF]" />
                      <p className="mt-2 text-sm font-bold text-[#0C0332]">Folio fully settled</p>
                      <p className="mt-1 text-xs text-[#6B6B6B]">Zero outstanding balance remaining.</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Execution" title="Complete departure">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-xs font-bold text-[#0C0332]">Post-checkout workflow</p>
                    <p className="mt-2 text-xs leading-5 text-[#6B6B6B]">
                      Completing checkout will record payment, mark the stay as Checked Out, update the invoice, and automatically set Room {selectedStay.roomNumber || ""} status to <strong>Cleaning</strong> for the housekeeping team.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    text={isProcessing ? "Completing check-out..." : "Complete check-out"}
                    disabled={isProcessing}
                    onClick={handleCheckOut}
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    text="Cancel"
                    onClick={() => router.push("/front-desk")}
                  />
                </div>
              </SectionCard>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
              <p className="text-[#6B6B6B]">Select an active stay to review folio and process departure.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
