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
  Users,
  UserPlus,
  UserMinus,
  Info
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
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
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

  const summaryCards = [
    {
      label: "Active Stays",
      value: formatNumber(activeStays.length),
      icon: BedDouble,
      href: "/front-desk/room-status",
      desc: "Guests currently in-house"
    },
    {
      label: "Today's Arrivals",
      value: formatNumber(arrivals.length),
      icon: UserPlus,
      href: "/front-desk/arrivals",
      desc: "Check-ins pending for today"
    },
    {
      label: "Today's Departures",
      value: formatNumber(departures.length),
      icon: UserMinus,
      href: "/front-desk/departures",
      desc: "Check-outs pending for today"
    },
  ];

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Operations Center
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Front Desk
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Monitor live guest activity, manage daily check-ins, and oversee hotel capacity.
        </p>
      </div>

      {/* ─── SUMMARY CARDS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href} className="group block">
            <div className="relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg hover:border-border h-full">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  <card.icon className="h-4 w-4" />
                  <span>{card.label}</span>
                </div>
                
                <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1 mb-6 transition-transform group-hover:-translate-y-1">
                  <p className="text-4xl font-extrabold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.desc}</p>
                </div>
              </div>
              
              <div className="flex items-center text-sm font-medium text-primary">
                View Management <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── ACTIVE STAYS LIST ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Currently In-House ({activeStays.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {activeStays.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                <Info className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">No active stays</p>
              <p className="text-sm text-muted-foreground mt-1">There are no guests currently checked in.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {activeStays.slice(0, 8).map((stay) => (
                <div
                  key={stay.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {stay.guestName?.charAt(0) || "G"}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{stay.guestName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Badge variant="secondary" className="rounded-md font-mono text-[10px] bg-muted/60 px-1.5 py-0">
                          Room {stay.roomNumber}
                        </Badge>
                        <span>{stay.roomTypeName || "Standard"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      Check-out: <span className="font-medium text-foreground">{formatDateTime(stay.expectedCheckoutAt)}</span>
                    </p>
                    {Number(stay.outstandingBalance) > 0 ? (
                      <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                        Owes {formatCurrency(stay.outstandingBalance)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
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
