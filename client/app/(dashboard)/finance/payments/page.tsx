"use client";

import { useEffect, useState } from "react";
import PaymentsService, { Payment } from "@/services/payments.service";
import InvoicesService, { Invoice } from "@/services/invoices.service";
import StaysService from "@/services/stays.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { useCurrency } from "@/utils/currency";
import { paymentStatusColors, paymentMethodColors } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/dashboard/page-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageLoading } from "@/components/dashboard/page-loading";
import { PageError } from "@/components/dashboard/page-error";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";


export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const currency = useCurrency();

  // For new payment form
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    stayId: "",
    invoiceId: "",
    amount: 0,
    method: "cash",
    notes: "",
  });

  const fetchPayments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await PaymentsService().getPayments();
      setPayments(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      if (!silent) setError("Could not load payments. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchPayments();
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useRealtimeRefresh(() => fetchPayments(true));

  const handleReverse = async (payment: Payment) => {
    if (
      !window.confirm(
        `Reverse payment ${payment.reference} of ${formatCurrency(payment.amount, currency)}?`,
      )
    )
      return;
    setReversingId(payment.id);
    try {
      await PaymentsService().reversePayment(payment.id);
      toast.success("Payment reversed");
      await fetchPayments();
    } catch (err) {
      console.error("Failed to reverse payment:", err);
      toast.error("Failed to reverse payment");
    } finally {
      setReversingId(null);
    }
  };

  const fetchFormData = async () => {
    try {
      const [staysData, invoicesData] = await Promise.all([
        StaysService().getActiveStays(),
        InvoicesService().getInvoices(),
      ]);
      setStays(staysData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error("Failed to fetch form data:", err);
      toast.error("Could not load stays/invoices for payment form");
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchPayments();
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active || !dialogOpen) return;
      fetchFormData();
    };
    init();
    return () => {
      active = false;
    };
  }, [dialogOpen]);

  const filteredPayments = payments.filter((payment) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      payment.reference.toLowerCase().includes(q) ||
      payment.method.toLowerCase().includes(q) ||
      payment.status.toLowerCase().includes(q);
    const matchesMethod =
      methodFilter === "all" || payment.method === methodFilter;
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleRecordPayment = async () => {
    setRecording(true);
    try {
      await PaymentsService().recordPayment({
        stayId: form.stayId,
        invoiceId: form.invoiceId,
        amount: form.amount,
        method: form.method as Payment["method"],
        notes: form.notes || undefined,
      });
      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      setForm({
        stayId: "",
        invoiceId: "",
        amount: 0,
        method: "cash",
        notes: "",
      });
      await fetchPayments();
    } catch (err) {
      console.error("Failed to record payment:", err);
      toast.error("Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return <PageLoading showHeader showCards={1} />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <PageLayout>
      <PageHeader
        badge="Financial Management"
        title="Payments"
        description="Record and track all payments."
        action={
          <Button className="rounded-full h-11" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      {/* Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
<DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Record Payment</DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                Enter payment details for a stay/invoice.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Stay *</Label>
                <Select
                  value={form.stayId}
                  onValueChange={(value) =>
                    setForm({ ...form, stayId: value || "" })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select stay" />
                  </SelectTrigger>
                  <SelectContent>
                    {stays.map((stay) => (
                      <SelectItem key={stay.id} value={stay.id}>
                        {stay.guestName || stay.reference} - Room{" "}
                        {stay.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Invoice *</Label>
                <Select
                  value={form.invoiceId}
                  onValueChange={(value) =>
                    setForm({ ...form, invoiceId: value || "" })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.reference} - {formatCurrency(inv.outstanding, currency)}{" "}
                        outstanding
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Amount *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                  required
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Method *</Label>
                <Select
                  value={form.method}
                  onValueChange={(value) =>
                    setForm({ ...form, method: value || "cash" })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="h-10 rounded-lg border-slate-200 hover:bg-slate-50">
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recording} className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors">
              {recording ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </DialogContent>
        </Dialog>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={methodFilter}
            onValueChange={(value) => setMethodFilter(value || "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value || "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="There are no payments matching your search criteria."
        />
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          paymentMethodColors[payment.method].bg,
                          paymentMethodColors[payment.method].text,
                          paymentMethodColors[payment.method].border
                        )}
                      >
                        {payment.method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          paymentStatusColors[payment.status].bg,
                          paymentStatusColors[payment.status].text,
                          paymentStatusColors[payment.status].border
                        )}
                      >
                        {payment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount, currency)}</TableCell>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status !== "reversed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={reversingId === payment.id}
                          onClick={() => handleReverse(payment)}
                        >
                          {reversingId === payment.id ? "..." : "Reverse"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
