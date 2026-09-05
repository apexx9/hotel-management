"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatDateTime, formatCurrency } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { AlertCircle, CheckCircle2, Clock, Users, BedDouble, Wallet, Search, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  const fetchDepartures = async () => {
    try {
      setLoading(true);
      const data = await StaysService().getDepartures();
      setDepartures(data);
    } catch (err) {
      console.error("Failed to fetch departures:", err);
      setError("Could not load departures. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, []);

  const openCheckoutDialog = (stay: DashboardStaySummary) => {
    setSelectedStay(stay);
    setAmountPaid(Number(stay.outstandingBalance) || 0);
    setPaymentMethod("cash");
    setOverrideBalance(false);
    setDialogOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedStay) return;
    setCheckingOutId(selectedStay.id);
    try {
      await BookingsService().checkOut({
        stayId: selectedStay.id,
        overrideBalance,
        amountPaid,
        paymentMethod,
      });
      toast.success("Guest checked out successfully");
      setDialogOpen(false);
      await fetchDepartures();
    } catch (err) {
      console.error("Check-out failed:", err);
      toast.error("Check-out failed. Please try again.");
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
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-14 w-full max-w-md rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
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
          Manage today's check-outs, process payments, and finalize guest stays.
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
              <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><BedDouble className="h-3 w-3" /> Room</span>
                    <p className="font-semibold">{stay.roomNumber || "Unassigned"} <span className="text-muted-foreground font-normal text-xs">({stay.roomTypeName || "N/A"})</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" /> Checkout</span>
                    <p className="font-medium text-foreground">{formatDateTime(stay.expectedCheckoutAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3 w-3" /> Stay</span>
                    <p className="font-medium text-foreground">{stay.guestsCount} guests · {stay.nights} nights</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Balance</span>
                    <p>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
                        Number(stay.outstandingBalance) > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"
                      )}>
                        {formatCurrency(stay.outstandingBalance)}
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
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-0 border-border/50 overflow-hidden">
          <div className="bg-muted/30 p-6 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Finalize Check Out</DialogTitle>
              <DialogDescription className="mt-1">
                <span className="font-semibold text-foreground">{selectedStay?.guestName}</span> · Room {selectedStay?.roomNumber}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-background rounded-2xl border border-border/60 p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Stay Value</span>
                <span className="font-medium">{formatCurrency(selectedStay?.total || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border/40 pt-2 mt-2">
                <span>Outstanding Balance</span>
                <span className={Number(selectedStay?.outstandingBalance) > 0 ? "text-destructive" : "text-emerald-600"}>
                  {formatCurrency(selectedStay?.outstandingBalance || 0)}
                </span>
              </div>
            </div>

            {Number(selectedStay?.outstandingBalance) > 0 && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount Paid Now</Label>
                  <Input
                    type="number"
                    className="h-11 rounded-xl bg-muted/20"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value || "cash")}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/20">
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
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <input
                    type="checkbox"
                    id="override"
                    checked={overrideBalance}
                    onChange={(e) => setOverrideBalance(e.target.checked)}
                    className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="override" className="text-sm font-medium cursor-pointer">Override remaining balance</Label>
                </div>
              </>
            )}
          </div>
          
          <div className="bg-muted/30 p-4 border-t border-border/40 flex justify-end gap-3">
            <Button variant="outline" className="rounded-full h-10 px-5" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className={cn("rounded-full h-10 px-5", Number(selectedStay?.outstandingBalance) > 0 && amountPaid < Number(selectedStay?.outstandingBalance) && !overrideBalance ? "opacity-50" : "")}
              onClick={handleCheckout} 
              disabled={checkingOutId === selectedStay?.id}
            >
              {checkingOutId === selectedStay?.id ? "Processing..." : "Confirm Departure"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
