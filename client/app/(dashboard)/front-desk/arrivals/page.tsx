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
import { AlertCircle, CheckCircle2, Clock, Users, BedDouble, Wallet, Search } from "lucide-react";
import { toast } from "sonner";

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
        <h1 className="text-2xl font-semibold tracking-tight">Arrivals</h1>
        <p className="text-sm text-muted-foreground">
          Guests expected to arrive today.
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

      {filteredArrivals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No arrivals found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredArrivals.map((stay) => (
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
                  <Badge variant="outline">Arriving</Badge>
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
                    <span>{formatDateTime(stay.expectedCheckInAt)}</span>
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

                {stay.specialRequests && (
                  <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
                    <span className="font-medium">Special Requests:</span>{" "}
                    {stay.specialRequests}
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <Button
                    className="w-full"
                    onClick={() => handleCheckIn(stay.id)}
                    disabled={checkingInId === stay.id}
                  >
                    {checkingInId === stay.id ? (
                      "Checking in..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Check In
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
