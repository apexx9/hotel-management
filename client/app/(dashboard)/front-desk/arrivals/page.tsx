"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatDateTime, formatCurrency, formatNumber } from "@/utils/utils";
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
import { AlertCircle, CheckCircle2, Clock, Users, BedDouble, Wallet, Search, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ArrivalsPage() {
  const [arrivals, setArrivals] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArrivals = async () => {
    try {
      setLoading(true);
      const data = await StaysService().getArrivals();
      setArrivals(data);
    } catch (err) {
      console.error("Failed to fetch arrivals:", err);
      setError("Could not load arrivals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, []);

  const handleCheckIn = async (stayId: string) => {
    setCheckingInId(stayId);
    try {
      await BookingsService().checkIn({ stayId });
      toast.success("Guest checked in successfully");
      await fetchArrivals();
    } catch (err) {
      console.error("Check-in failed:", err);
      toast.error("Check-in failed. Please try again.");
    } finally {
      setCheckingInId(null);
    }
  };

  const filteredArrivals = arrivals.filter((stay) => {
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
            Guest Arrivals
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Manage today's check-ins and process incoming guests smoothly.
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
      {filteredArrivals.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No arrivals pending</p>
          <p className="text-sm text-muted-foreground mt-1">All scheduled guests have checked in or none are expected today.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredArrivals.map((stay) => (
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
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 rounded-full px-3">
                    Arriving
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
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" /> Expected</span>
                    <p className="font-medium text-foreground">{formatDateTime(stay.expectedCheckInAt)}</p>
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

                {stay.specialRequests && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mt-2">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Special Requests</p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-400/80">{stay.specialRequests}</p>
                  </div>
                )}

                <div className="mt-auto pt-4">
                  <Button
                    className="w-full rounded-full h-11"
                    onClick={() => handleCheckIn(stay.id)}
                    disabled={checkingInId === stay.id}
                  >
                    {checkingInId === stay.id ? (
                      "Checking in..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete Check In
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
