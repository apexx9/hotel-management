"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import PaymentsService from "@/services/payments.service";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const paymentsService = PaymentsService();
        const paymentsData = await paymentsService.getPayments();
        setPayments(paymentsData);
      } catch (err) {
        console.error("Failed to load payments data:", err);
        setError("Failed to load payments data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const total = payments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
  const byMethod = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.method] = (acc[payment.method] ?? 0) + Number(payment.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        title="Payment activity"
        description="Track payment methods, balances, and receipts associated with each stay."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading payment data...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard title="Total received">
              <p className="text-3xl font-bold text-[#0C0332]">{formatCurrency(total)}</p>
            </SectionCard>
            <SectionCard title="Payments recorded">
              <p className="text-3xl font-bold text-[#0C0332]">{payments.length}</p>
            </SectionCard>
            <SectionCard title="Payment methods">
              <p className="text-3xl font-bold text-[#0C0332]">{Object.keys(byMethod).length}</p>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SectionCard eyebrow="Method mix" title="Payments by method">
              <div className="space-y-4">
                {Object.entries(byMethod).length > 0 ? Object.entries(byMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center gap-4">
                    <span className="w-28 text-[12px] font-bold text-[#0C0332] capitalize">
                      {method}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F1F1]">
                      <div className="h-full rounded-full bg-[#1900FF]" style={{ width: `${(amount / total) * 100}%` }} />
                    </div>
                    <span className="w-24 text-right text-[12px] font-bold text-[#0C0332]">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No payment data available.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Ledger" title="Recent payments">
              <div className="space-y-3">
                {payments.length > 0 ? payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-bold text-[#0C0332]">
                          Guest {payment.guestId}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6B6B6B]">
                          {payment.reference} · {payment.method} · {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusChip label={payment.status} tone={payment.status === "paid" ? "success" : "warning"} />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No payments recorded.
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

