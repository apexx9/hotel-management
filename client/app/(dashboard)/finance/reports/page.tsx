"use client";

import { useEffect, useState } from "react";
import ReportsService, { ReportsRange } from "@/services/reports.service";
import type { ReportsSummaryResponse } from "@/actions/operations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  TrendingUp,
  BedDouble,
  Users,
  CalendarClock,
  Wallet,
  Sparkles,
  DoorOpen,
  ArrowUpRight,
  ClipboardList,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageLoading } from "@/components/dashboard/page-loading";
import { RefreshButton } from "@/components/dashboard/refresh-button";

export default function ReportsPage() {
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<ReportsRange>("today");

  const fetchReport = async (selectedRange: ReportsRange, showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const summary = await ReportsService().getSummary({ range: selectedRange });
      setData(summary);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      if (showLoader) setError("Could not load report data. Please try again.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(range, true);
  }, [range]);

  if (loading) {
    return <PageLoading showHeader showStats={6} showTable />;
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/30 bg-destructive/10"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>
            {error || "Something went wrong loading the report."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { occupancy, revenue, bookings, guests, housekeeping, dailyTrends, roomTypeRevenue } = data;

  const rangeLabel =
    range === "today"
      ? "Today"
      : range === "7d"
        ? "Last 7 Days"
        : range === "30d"
          ? "Last 30 Days"
          : "Last 90 Days";

  const summaryCards = [
    {
      label: "Occupancy",
      value: `${occupancy.occupancyRate}%`,
      sub: `${occupancy.occupiedRooms} of ${occupancy.totalRooms} rooms`,
      icon: BedDouble,
      chip: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(revenue.totalRevenue),
      sub: `+${formatCurrency(revenue.roomRevenue)} rooms · ${formatCurrency(revenue.serviceRevenue)} services`,
      icon: Wallet,
      chip: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Outstanding",
      value: formatCurrency(revenue.outstandingBalance),
      sub: "Uncollected balance",
      icon: TrendingUp,
      chip: "bg-red-500/10 text-red-600",
    },
    {
      label: "Active Stays",
      value: formatNumber(bookings.activeStays),
      sub: `${bookings.totalBookings} total · ${bookings.completedStays} completed`,
      icon: CalendarClock,
      chip: "bg-indigo-500/10 text-indigo-600",
    },
    {
      label: "Total Guests",
      value: formatNumber(guests.totalGuests),
      sub: `+${guests.newGuests} new this period`,
      icon: Users,
      chip: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Housekeeping",
      value: formatNumber(
        housekeeping.cleaning +
          housekeeping.inspection +
          housekeeping.ready +
          housekeeping.maintenance,
      ),
      sub: `${housekeeping.cleaning} cleaning · ${housekeeping.ready} ready`,
      icon: Sparkles,
      chip: "bg-amber-500/10 text-amber-600",
    },
  ];

  const turnover = housekeeping.cleaning + housekeeping.inspection;

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Financial Performance
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reports
          </h1>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            Financial and operational performance for {rangeLabel.toLowerCase()}.
          </p>
          <div className="flex items-center gap-3">
            <RefreshButton onRefresh={() => fetchReport(range, true)} />
            <Select value={range} onValueChange={(value) => setRange(value || "today")}>
              <SelectTrigger className="h-10 rounded-full border-border/60 bg-background shadow-sm w-40">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="rounded-3xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </span>
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", card.chip)}>
                  <card.icon className="h-4 w-4" />
                </span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
              <p className="text-[11px] text-muted-foreground leading-snug">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── FEATURED OCCUPANCY / OPERATIONS STRIP ─────────────────── */}
      <div className="rounded-3xl bg-primary text-primary-foreground p-6 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl pointer-events-none" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <BedDouble className="h-3.5 w-3.5" /> Occupancy Rate
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{occupancy.occupancyRate}%</p>
            <div className="h-2 w-full max-w-[220px] rounded-full bg-primary-foreground/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                style={{ width: `${Math.min(occupancy.occupancyRate, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <DoorOpen className="h-3.5 w-3.5" /> Available Rooms
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{occupancy.availableRooms}</p>
            <p className="text-xs text-primary-foreground/70">
              {occupancy.maintenanceRooms} in maintenance / out of service
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <ArrowUpRight className="h-3.5 w-3.5" /> Bookings
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{bookings.totalBookings}</p>
            <p className="text-xs text-primary-foreground/70">
              {bookings.cancelledStays} cancelled · {bookings.completedStays} completed
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80">
              <Sparkles className="h-3.5 w-3.5" /> Turnover
            </div>
            <p className="text-3xl font-extrabold tracking-tight">{turnover}</p>
            <p className="text-xs text-primary-foreground/70">
              {housekeeping.ready} rooms ready · {housekeeping.maintenance} maintenance
            </p>
          </div>
        </div>
      </div>

      {/* ─── DETAILED BREAKDOWN ───────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Detailed Breakdown
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue breakdown */}
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Room Revenue</span>
                <span className="font-semibold">{formatCurrency(revenue.roomRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Revenue</span>
                <span className="font-semibold">{formatCurrency(revenue.serviceRevenue)}</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex justify-between text-base font-semibold">
                <span className="text-foreground">Total Revenue</span>
                <span className="text-emerald-600">{formatCurrency(revenue.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-destructive">
                  {formatCurrency(revenue.outstandingBalance)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bookings breakdown */}
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bookings</span>
                <span className="font-semibold">{bookings.totalBookings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Stays</span>
                <span className="font-semibold">{bookings.activeStays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold text-emerald-600">{bookings.completedStays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cancelled</span>
                <span className="font-semibold text-destructive">{bookings.cancelledStays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Guests</span>
                <span className="font-semibold text-primary">+{guests.newGuests}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── DAILY TRENDS ─────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Daily Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {dailyTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trend data available for this period.</p>
          ) : (
            <div className="space-y-4">
              {dailyTrends.map((day) => (
                <div key={day.date} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{day.label}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(day.revenue)} · {day.occupancy}% occupancy
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(day.occupancy, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── ROOM TYPE REVENUE ────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />
            Revenue by Room Type
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          {roomTypeRevenue.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No room type revenue data.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Room Type</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Revenue</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypeRevenue.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right">{item.bookingsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}