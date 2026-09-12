"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import InvoicesService from "@/services/invoices.service";
import type { DashboardStaySummary } from "@/actions/operations";
import type { Invoice } from "@/services/invoices.service";
import { formatCurrency, formatDateTimeWithDate } from "@/utils/utils";
import { useCurrency } from "@/utils/currency";
import { getCurrency } from "@/utils/currency";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  BedDouble,
  Wallet,
  Search,
  Info,
  ArrowRightLeft,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
  itemType?: string | null;
}

export default function DeparturesPage() {
  const [departures, setDepartures] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);
  const [selectedStay, setSelectedStay] = useState<DashboardStaySummary | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [overrideBalance, setOverrideBalance] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [loadingFolio, setLoadingFolio] = useState(false);
  const currency = useCurrency();

  const fetchDepartures = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const data = await StaysService().getDepartures();
      setDepartures(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch departures:", err);
      if (showLoading) setError("Could not load departures. Please try again.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchDepartures(true);
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useRealtimeRefresh(() => fetchDepartures(false));

  const openCheckoutDialog = async (stay: DashboardStaySummary) => {
    setSelectedStay(stay);
    setAmountPaid(Number(stay.outstandingBalance) || 0);
    setPaymentMethod("cash");
    setOverrideBalance(false);
    setInvoice(null);
    setLineItems([]);
    setDialogOpen(true);

    setLoadingFolio(true);
    try {
      const invoices = await InvoicesService().getInvoices(stay.id);
      const inv = invoices[0];
      if (inv) {
        setInvoice(inv);
        const items = await InvoicesService().getInvoiceItems(inv.id);
        setLineItems(items);
      }
    } catch {
      // non-critical — dialog still works without folio
    } finally {
      setLoadingFolio(false);
    }
  };

  const stayTotal = Number(selectedStay?.total || 0);
  const stayDiscount = Number(selectedStay?.discount || 0);
  const stayTax = Number(selectedStay?.taxes || 0);
  const stayRate = Number(selectedStay?.rate || 0);
  const stayNights = Number(selectedStay?.nights || 0);
  const stayServiceTotal = Number(selectedStay?.serviceTotal || 0);
  const outstanding = Number(selectedStay?.outstandingBalance || 0);
  const alreadyPaid = Number(selectedStay?.amountPaid || 0);
  const remaining = Math.max(0, outstanding - amountPaid);

  const checkoutBlocked = Boolean(
    selectedStay && outstanding > 0 && amountPaid < outstanding && !overrideBalance,
  );

  const handleCheckout = async () => {
    if (!selectedStay) return;
    setCheckingOutId(selectedStay.id);
    try {
      const result = await BookingsService().checkOut({
        stayId: selectedStay.id,
        overrideBalance,
        amountPaid,
        paymentMethod,
      });
      toast.success("Guest checked out successfully");
      setDialogOpen(false);

      const invoiceId = (result as { invoiceId?: string })?.invoiceId;
      if (invoiceId) {
        try {
          const html = await InvoicesService().getInvoiceReceipt(invoiceId);
          const win = window.open("", "_blank");
          if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          }
        } catch {
          // receipt is non-critical
        }
      }

      await fetchDepartures(true);
    } catch (err) {
      console.error("Check-out failed:", err);
      const message =
        err instanceof Error ? err.message : "Check-out failed. Please try again.";
      toast.error(message);
    } finally {
      setCheckingOutId(null);
    }
  };

  const filteredDepartures = departures.filter((stay) => {
    const q = searchQuery.toLowerCase();
    return (
      stay.guestName?.toLowerCase().includes(q) ||
      stay.roomNumber?.toLowerCase().includes(q) ||
      stay.reference?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <PageLoading showHeader showPills showGrid />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Front Desk Operations
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Guest Departures
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Manage today&apos;s check-outs, process payments, and finalize guest stays.
        </p>
      </div>

      {/* ─── ACTION BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by guest, room, or reference..."
            className="pl-10 h-12 rounded-full bg-muted/40 border-border/50 focus-visible:ring-primary/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ─── GRID ────────────────────────────────────────────── */}
      {filteredDepartures.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No departures pending</p>
          <p className="text-sm text-muted-foreground mt-1">All scheduled guests have checked out or none are expected today.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredDepartures.map((stay) => (
            <Card key={stay.id} className="flex flex-col rounded-3xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-4 border-b border-border/40 bg-muted/10">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {stay.guestName}
                    </CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {stay.reference}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20 rounded-full px-3">
                    Departing
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 pt-5">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><BedDouble className="h-3 w-3" /> Room</span>
                    <p className="font-semibold">{stay.roomNumber || "Unassigned"} <span className="text-muted-foreground font-normal text-xs">({stay.roomTypeName || "N/A"})</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><ArrowRightLeft className="h-3 w-3" /> Arrived</span>
                    <p className="font-medium text-foreground">{formatDateTimeWithDate(stay.checkInAt || stay.expectedCheckInAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" /> Checkout</span>
                    <p className="font-medium text-foreground">{formatDateTimeWithDate(stay.expectedCheckoutAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3 w-3" /> Stay</span>
                    <p className="font-medium text-foreground">{stay.guestsCount} guests · {stay.nights} nights</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Total</span>
                    <p className="font-medium text-foreground">{formatCurrency(stay.total, currency)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Balance</span>
                    <p>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                        Number(stay.outstandingBalance) > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {formatCurrency(stay.outstandingBalance, currency)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <Button
                    className={cn(
                      "w-full rounded-full h-11",
                      Number(stay.outstandingBalance) > 0 ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                    )}
                    onClick={() => openCheckoutDialog(stay)}
                    disabled={checkingOutId === stay.id}
                  >
                    {checkingOutId === stay.id ? (
                      "Processing..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {Number(stay.outstandingBalance) > 0 ? "Settle & Check Out" : "Complete Check Out"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── CHECKOUT DIALOG ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Finalize Check Out
              </DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-semibold text-slate-800">{selectedStay?.guestName}</span>
                <span className="text-slate-500"> · Room {selectedStay?.roomNumber} · </span>
                <span className="text-slate-400">{selectedStay?.reference}</span>
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="p-6 space-y-6">
              {/* ── FOLIO BREAKDOWN ───────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ReceiptText className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">Folio Summary</h3>
                  {invoice && (
                    <span className="ml-auto text-xs font-mono text-slate-400">{invoice.reference}</span>
                  )}
                </div>

                <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      Room · {stayNights} night{stayNights === 1 ? "" : "s"} × {formatCurrency(stayRate, currency)}
                    </span>
                    <span className="font-medium text-slate-800">{formatCurrency(stayRate * stayNights, currency)}</span>
                  </div>

                  {lineItems.filter((i) => i.itemType === "service").length > 0 && (
                    <>
                      <div className="h-px bg-slate-200/60" />
                      {lineItems
                        .filter((i) => i.itemType === "service")
                        .map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.description}</span>
                            <span className="font-medium text-slate-800">{formatCurrency(item.total, currency)}</span>
                          </div>
                        ))}
                    </>
                  )}

                  {loadingFolio && (
                    <div className="flex items-center justify-center py-3">
                      <LoadingSpinner className="gap-0" text="" />
                    </div>
                  )}

                  {stayDiscount > 0 && (
                    <>
                      <div className="h-px bg-slate-200/60" />
                      <div className="flex justify-between text-sm text-emerald-700">
                        <span>Discount</span>
                        <span>- {formatCurrency(stayDiscount, currency)}</span>
                      </div>
                    </>
                  )}

                  {stayTax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Taxes</span>
                      <span className="font-medium text-slate-800">+ {formatCurrency(stayTax, currency)}</span>
                    </div>
                  )}

                  {stayServiceTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Service charges</span>
                      <span className="font-medium text-slate-800">+ {formatCurrency(stayServiceTotal, currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2.5 mt-1">
                    <span className="text-slate-800">Total</span>
                    <span className="text-slate-900">{formatCurrency(stayTotal, currency)}</span>
                  </div>
                </div>
              </div>

              {/* ── PAYMENT SUMMARY ───────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">Payment</h3>
                </div>

                <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Already paid</span>
                    <span className="font-medium text-slate-800">{formatCurrency(alreadyPaid, currency)}</span>
                  </div>
                  {outstanding > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Outstanding before checkout</span>
                      <span className="font-medium text-destructive">{formatCurrency(outstanding, currency)}</span>
                    </div>
                  )}

                  {outstanding > 0 && (
                    <>
                      <div className="h-px bg-slate-200/60" />
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Amount collected now
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{getCurrency()}</span>
                            <Input
                              type="number"
                              className="h-10 pl-7 rounded-lg bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                              value={amountPaid}
                              onChange={(e) => setAmountPaid(Number(e.target.value))}
                              min={0}
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Payment method
                          </Label>
                          <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || "cash")}>
                            <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 shadow-sm">
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2.5 mt-1">
                        <span className="text-slate-800">Balance after payment</span>
                        <span className={cn(
                          remaining > 0 ? "text-destructive" : "text-emerald-600"
                        )}>
                          {formatCurrency(remaining, currency)}
                        </span>
                      </div>
                    </>
                  )}

                  {outstanding <= 0 && (
                    <div className="flex items-center gap-2 pt-1 text-sm text-emerald-700 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Fully settled — ready for departure
                    </div>
                  )}
                </div>
              </div>

              {/* ── OVERRIDE BALANCE ───────────────────────────── */}
              {outstanding > 0 && (
                <div className={cn(
                  "rounded-xl border p-4 space-y-2 transition-colors",
                  overrideBalance
                    ? "border-red-300 bg-red-50/50"
                    : "border-amber-200 bg-amber-50/30",
                )}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={cn(
                      "h-4 w-4",
                      overrideBalance ? "text-red-600" : "text-amber-600",
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      overrideBalance ? "text-red-800" : "text-amber-800",
                    )}>
                      {overrideBalance ? "Balance override active" : "Outstanding balance remains"}
                    </span>
                  </div>
                  <label
                    htmlFor="override"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="override"
                      checked={overrideBalance}
                      onChange={(e) => setOverrideBalance(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Override remaining balance</span>
                      <span className="text-slate-500 ml-1.5">
                        (finalize checkout without full settlement)
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <div className="shrink-0 border-t border-slate-100 p-5 bg-white flex justify-end gap-3 rounded-b-2xl">
            <Button
              variant="outline"
              className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={checkingOutId === selectedStay?.id || checkoutBlocked}
              className={cn(
                "h-10 rounded-lg transition-colors flex items-center gap-2",
                checkoutBlocked
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                  : outstanding > 0
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {checkingOutId === selectedStay?.id ? (
                <>
                  <LoadingSpinner className="gap-0" text="" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {outstanding > 0
                    ? remaining > 0 && overrideBalance
                      ? "Override & Check Out"
                      : "Settle & Check Out"
                    : "Complete Check Out"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}