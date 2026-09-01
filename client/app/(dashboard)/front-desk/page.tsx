"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import type { DashboardStaySummary } from "@/actions/operations";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarClock,
  Users,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { formatDateTime, formatCurrency, formatNumber } from "@/utils/utils";

export default function FrontDeskOverviewPage() {
  const [activeStays, setActiveStays] = useState<DashboardStaySummary[]>([]);
  const [arrivals, setArrivals] = useState<DashboardStaySummary[]>([]);
  const [departures, setDepartures] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [active, arr, dep] = await Promise.all([
          StaysService().getActiveStays(),
          StaysService().getArrivals(),
          StaysService().getDepartures(),
        ]);
        setActiveStays(active);
        setArrivals(arr);
        setDepartures(dep);
      } catch (err) {
        console.error("Failed to fetch front desk data:", err);
        setError("Could not load front desk overview. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
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

  const summaryCards = [
    {
      label: "Active Stays",
      value: formatNumber(activeStays.length),
      icon: BedDouble,
      href: "/front-desk/room-status",
    },
    {
      label: "Today's Arrivals",
      value: formatNumber(arrivals.length),
      icon: UserPlus,
      href: "/front-desk/arrivals",
    },
    {
      label: "Today's Departures",
      value: formatNumber(departures.length),
      icon: UserMinus,
      href: "/front-desk/departures",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Front Desk</h1>
        <p className="text-sm text-muted-foreground">
          Monitor live guest activity and manage daily operations.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  View details <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active stays list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5" />
            Currently In-House ({activeStays.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeStays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active stays.</p>
          ) : (
            <div className="space-y-3">
              {activeStays.slice(0, 6).map((stay) => (
                <div
                  key={stay.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{stay.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {stay.roomNumber} · {stay.roomTypeName || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDateTime(stay.expectedCheckoutAt)}
                    </p>
                    {Number(stay.outstandingBalance) > 0 ? (
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        Owes {formatCurrency(stay.outstandingBalance)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Settled
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
