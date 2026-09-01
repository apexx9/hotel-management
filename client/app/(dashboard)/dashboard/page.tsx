"use client";

import { useEffect, useState } from "react";
import DashboardService from "@/services/dashboard.service";
import type { DashboardSummaryResponse } from "@/actions/operations";
import { formatCurrency, formatDateTime, formatDate, formatNumber } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowUpRight,
  BedDouble,
  CalendarClock,
  Users,
  Wallet,
  Sparkles,
  Bell,
  Activity,
  DoorOpen,
  ArrowRight,
  ShieldAlert,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const summary = await DashboardService().getSummary();
        setData(summary);
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
        setError("Could not load dashboard data. Please try again.");
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
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>{error || "Something went wrong loading dashboard data."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    dashboardStats,
    arrivals,
    departures,
    roomStatus,
    housekeeping,
    attentionItems,
    recentActivity,
    nextArrival,
    nextDeparture
  } = data;

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">

      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Hotel Overview
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Smarter Systems For Better <br className="hidden sm:inline" />
            Hospitality Management
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Real-time occupancy tracking, seamless guest check-ins, and live room maintenance.
        </p>
      </div>

      {/* ─── TOP FEATURED CARDS (INSPIRED BY 3-CARD HERO ROW) ───────── */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* Card 1: Guest Arrivals Spotlight */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg hover:border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              <Users className="h-4 w-4" />
              <span>Arrivals ({arrivals.length})</span>
            </div>

            {/* Embedded Floating Inner Preview Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3 mb-6 transition-transform group-hover:-translate-y-1">
              {nextArrival ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Next Check-In</p>
                      <h4 className="font-bold text-base text-foreground mt-0.5">{nextArrival.guestName}</h4>
                    </div>
                    <Badge variant="secondary" className="rounded-lg text-[10px] font-mono">
                      {nextArrival.roomNumber}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                    <span>{nextArrival.roomTypeName}</span>
                    <span className="font-semibold text-foreground">{formatDateTime(nextArrival.expectedCheckInAt)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No upcoming check-ins scheduled for today.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Manage Guest Arrivals</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Track incoming guests, confirm booking details, and prepare keys seamlessly.
            </p>
          </div>
        </div>

        {/* Card 2: Guest Departures & Balances */}
        <div className="group relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg hover:border-border">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              <CalendarClock className="h-4 w-4" />
              <span>Departures ({departures.length})</span>
            </div>

            {/* Embedded Floating Inner Preview Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-3 mb-6 transition-transform group-hover:-translate-y-1">
              {nextDeparture ? (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Next Checkout</p>
                      <h4 className="font-bold text-base text-foreground mt-0.5">{nextDeparture.guestName}</h4>
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded-md">
                      Room {nextDeparture.roomNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-border/40 pt-2">
                    <span className="text-muted-foreground">Folio Balance</span>
                    {nextDeparture.outstandingBalance && Number(nextDeparture.outstandingBalance) > 0 ? (
                      <span className="font-bold text-destructive">
                        Due: {formatCurrency(nextDeparture.outstandingBalance)}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Settled
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No remaining departures today.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Express Check-Out</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Handle billing, inspect mini-bars, and release room status instantly.
            </p>
          </div>
        </div>

        {/* Card 3: High-Contrast Hero Card (Matches Green/Dark Featured Card in Inspiration) */}
        <div className="relative flex flex-col justify-between rounded-3xl bg-primary text-primary-foreground p-6 shadow-xl overflow-hidden">
          {/* Subtle Ambient Background Highlight */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 border-none rounded-full px-3 py-0.5 text-xs">
                Operations Status
              </Badge>
              <Bell className="h-4 w-4 text-primary-foreground/80" />
            </div>

            {/* Inner Dark Floating Panel */}
            <div className="bg-primary-foreground/10 backdrop-blur-md rounded-2xl p-4 border border-primary-foreground/20 space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-foreground/90">
                <ShieldAlert className="h-4 w-4" />
                <span>Action Items ({attentionItems.length})</span>
              </div>
              {attentionItems.length > 0 ? (
                <div>
                  <p className="text-sm font-bold leading-tight text-primary-foreground">
                    {attentionItems[0].title}
                  </p>
                  <p className="text-xs text-primary-foreground/75 mt-1 line-clamp-2">
                    {attentionItems[0].description}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-primary-foreground/80">
                  All systems operational. No urgent issues reported.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl tracking-tight">System Controls & Alerts</h3>
            <p className="text-xs text-primary-foreground/80 mt-1 leading-relaxed">
              Configured workflows to optimize hotel turnaround times and prevent errors.
            </p>
          </div>
        </div>

      </div>

      {/* ─── BIG STATS ROW (INSPIRED BY THE PERCENTAGE CALLOUTS) ─────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-border/40">
        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {dashboardStats.occupancy}%
          </p>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> Total Occupancy
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {formatNumber(dashboardStats.availableRooms)}
          </p>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <DoorOpen className="h-3.5 w-3.5" /> Rooms Ready
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(dashboardStats.revenueCollectedToday)}
          </p>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5" /> Revenue Today
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(dashboardStats.projectedEndOfDayRevenue)}
          </p>
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" /> Projected EOD
          </p>
        </div>
      </div>

      {/* ─── CORE MODULES / DETAILED BREAKDOWN ──────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Badge
              variant="outline"
              className="rounded-full px-3 py-0.5 text-xs bg-muted/60 text-muted-foreground border-border/60"
            >
              Core Modules
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Operational Breakdown</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-12">

          {/* Housekeeping Section */}
          <Card className="md:col-span-6 rounded-3xl border border-border/50 bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Housekeeping Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Cleaning</span>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {housekeeping.cleaning}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Inspection</span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {housekeeping.inspection}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Ready</span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {housekeeping.ready}
                  </p>
                </div>
                <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4">
                  <span className="text-xs font-medium text-destructive">Maintenance</span>
                  <p className="text-2xl font-bold text-destructive mt-1">
                    {housekeeping.maintenance}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Inventory & Rates */}
          <Card className="md:col-span-6 rounded-3xl border border-border/50 bg-card shadow-sm flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                Inventory & Yield
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Occupied Rooms</span>
                  <span className="font-semibold">{roomStatus.occupied} / {roomStatus.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Turning Over</span>
                  <span className="font-semibold">{roomStatus.turningOver}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Nightly Rate (ADR)</span>
                  <span className="font-semibold text-primary">{formatCurrency(roomStatus.averageNightlyRate)}</span>
                </div>
              </div>

              {/* Minimal Progress Visualizer */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Capacity Utilization</span>
                  <span>{dashboardStats.occupancy}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(dashboardStats.occupancy, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ─── SYSTEM ACTIVITY STREAM ──────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No recent activity recorded.</p>
          ) : (
            <div className="divide-y divide-border/30">
              {recentActivity.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-semibold">{act.actorName || "System"}</span>{" "}
                        <span className="text-muted-foreground">{act.event}</span>
                      </p>
                      {act.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0 ml-4">
                    {formatDate(act.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
