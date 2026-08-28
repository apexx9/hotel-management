"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import InvoicesService from "@/services/invoices.service";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const invoicesService = InvoicesService();
        const invoicesData = await invoicesService.getInvoices();
        setInvoices(invoicesData);
      } catch (err) {
        console.error("Failed to load invoices data:", err);
        setError("Failed to load invoices data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invoices"
        title="Invoice and receipt tracking"
        description="Review invoice status, paid amounts, and open balances."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading invoice data...</p>
        </div>
      )}

      {!isLoading && (
        <SectionCard eyebrow="Invoices" title="Current documents">
          <div className="space-y-3">
            {invoices.length > 0 ? invoices.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold text-[#0C0332]">
                      {invoice.reference} · Guest {invoice.guestId}
                    </p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">
                      Room {invoice.roomId} · Stay {invoice.stayId}
                    </p>
                  </div>
                  <StatusChip label={invoice.status} tone={Number(invoice.outstanding) > 0 ? "warning" : "success"} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-[12px] text-[#6B6B6B]">
                  <div>
                    <p className="font-bold text-[#0C0332]">{formatCurrency(Number(invoice.total))}</p>
                    <p>Total</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0C0332]">{formatCurrency(Number(invoice.amountPaid))}</p>
                    <p>Paid</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#0C0332]">{formatCurrency(Number(invoice.outstanding))}</p>
                    <p>Outstanding</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                No invoices found.
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

