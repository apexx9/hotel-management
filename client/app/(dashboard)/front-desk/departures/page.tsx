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
import { AlertCircle, CheckCircle2, Clock, Users, BedDouble, Wallet, Search } from "lucide-react";
import { toast } from "sonner";

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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Departures</h1>
        <p className="text-sm text-muted-foreground">
          Guests expected to depart today.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by guest, room, or reference..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredDepartures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No departures found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDepartures.map((stay) => (
            <Card key={stay.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {stay.guestName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {stay.reference}
                    </p>
                  </div>
                  <Badge variant="outline">Departing</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Room {stay.roomNumber} · {stay.roomTypeName || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(stay.expectedCheckoutAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{stay.guestsCount} guests · {stay.nights} nights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Outstanding:{" "}
                      <span
                        className={
                          Number(stay.outstandingBalance) > 0
                            ? "text-red-600 font-medium"
                            : "text-green-600 font-medium"
                        }
                      >
                        {formatCurrency(stay.outstandingBalance)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-3">
                  <Button
                    className="w-full"
                    onClick={() => openCheckoutDialog(stay)}
                    disabled={checkingOutId === stay.id}
                  >
                    {checkingOutId === stay.id ? (
                      "Checking out..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Check Out
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check Out Guest</DialogTitle>
            <DialogDescription>
              {selectedStay?.guestName} · Room {selectedStay?.roomNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount Paid</Label>
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min={0}
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="override"
                checked={overrideBalance}
                onChange={(e) => setOverrideBalance(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="override">Override outstanding balance</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={checkingOutId === selectedStay?.id}>
              Confirm Check Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
