"use client";

import { useEffect, useState } from "react";
import ReportsService from "@/services/reports.service";
import type { ReportsSummaryResponse } from "@/actions/operations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  ClipboardList,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const [data, setData] = useState<ReportsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<string>("today");

  const fetchReport = async (selectedRange: string) => {
    try {
      setLoading(true);
      const summary = await ReportsService().getSummary({ range: selectedRange });
      setData(summary);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Could not load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(range);
  }, [range]);

  const handleRangeChange = (value: string) => {
    setRange(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Something went wrong."}</AlertDescription>
      </Alert>
    );
  }

  const { occupancy, revenue, bookings, guests, housekeeping, dailyTrends, roomTypeRevenue } = data;

  const summaryCards = [
    {
      label: "Occupancy Rate",
      value: `${occupancy.occupancyRate}%`,
      icon: BedDouble,
      color: "text-blue-600",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(revenue.totalRevenue),
      icon: Wallet,
      color: "text-green-600",
    },
    {
      label: "Outstanding",
      value: formatCurrency(revenue.outstandingBalance),
      icon: TrendingUp,
      color: "text-red-600",
    },
    {
      label: "Active Stays",
      value: formatNumber(bookings.activeStays),
      icon: CalendarClock,
      color: "text-indigo-600",
    },
    {
      label: "Total Guests",
      value: formatNumber(guests.totalGuests),
      icon: Users,
      color: "text-purple-600",
    },
    {
      label: "Housekeeping",
      value: formatNumber(
        housekeeping.cleaning +
          housekeeping.inspection +
          housekeeping.ready +
          housekeeping.maintenance
      ),
      icon: Sparkles,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Financial and operational performance overview.
          </p>
        </div>
        <div className="w-40">
          <Select value={range} onValueChange={handleRangeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Occupancy breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Occupancy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Rooms</span>
              <span className="font-medium">{occupancy.totalRooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Occupied</span>
              <span className="font-medium">{occupancy.occupiedRooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Available</span>
              <span className="font-medium">{occupancy.availableRooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Maintenance</span>
              <span className="font-medium">{occupancy.maintenanceRooms}</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Room Revenue</span>
              <span className="font-medium">{formatCurrency(revenue.roomRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Service Revenue</span>
              <span className="font-medium">{formatCurrency(revenue.serviceRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-medium">{formatCurrency(revenue.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Outstanding</span>
              <span className="font-medium text-red-600">
                {formatCurrency(revenue.outstandingBalance)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Bookings</span>
              <span className="font-medium">{bookings.totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Stays</span>
              <span className="font-medium">{bookings.activeStays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-medium">{bookings.completedStays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cancelled</span>
              <span className="font-medium">{bookings.cancelledStays}</span>
            </div>
          </CardContent>
        </Card>

        {/* Guests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Guests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Guests</span>
              <span className="font-medium">{guests.totalGuests}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Guests</span>
              <span className="font-medium">{guests.newGuests}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Daily Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trend data available.</p>
          ) : (
            <div className="space-y-3">
              {dailyTrends.map((day) => (
                <div key={day.date} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{day.label}</span>
                    <span>{formatCurrency(day.revenue)} · {day.occupancy}% occupancy</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.min(day.occupancy, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room type revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Revenue by Room Type</CardTitle>
        </CardHeader>
        <CardContent>
          {roomTypeRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No room type revenue data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Type</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Bookings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypeRevenue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.revenue)}</TableCell>
                    <TableCell>{item.bookingsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
