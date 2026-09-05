"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatDateTime, formatCurrency, formatDate } from "@/utils/utils";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Search, CalendarClock, CreditCard, User, Info, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form fields for new reservation
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    roomTypeId: "",
    guestsCount: 1,
    nights: 1,
    expectedCheckInAt: "",
    rate: 0,
    discount: 0,
    taxes: 0,
    specialRequests: "",
    checkInNow: false,
    amountPaid: 0,
    paymentMethod: "cash",
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      // Fetch reservations (status 'reserved') or all stays and filter
      const allStays = await StaysService().getStays();
      // Assuming status 'reserved' indicates upcoming reservations
      const reserved = allStays.filter((s) => s.status === "reserved");
      setReservations(reserved);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      setError("Could not load reservations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.guestName?.toLowerCase().includes(q) ||
      r.reference?.toLowerCase().includes(q) ||
      r.roomNumber?.toLowerCase().includes(q)
    );
  });

  const handleCreateReservation = async () => {
    setCreating(true);
    try {
      await BookingsService().createBooking({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        roomTypeId: form.roomTypeId || undefined,
        guestsCount: form.guestsCount,
        nights: form.nights,
        expectedCheckInAt: form.expectedCheckInAt,
        rate: form.rate,
        discount: form.discount,
        taxes: form.taxes,
        specialRequests: form.specialRequests || undefined,
        checkInNow: form.checkInNow,
        amountPaid: form.amountPaid,
        paymentMethod: form.paymentMethod || undefined,
      });
      toast.success("Reservation created successfully");
      setDialogOpen(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        roomTypeId: "",
        guestsCount: 1,
        nights: 1,
        expectedCheckInAt: "",
        rate: 0,
        discount: 0,
        taxes: 0,
        specialRequests: "",
        checkInNow: false,
        amountPaid: 0,
        paymentMethod: "cash",
      });
      await fetchReservations();
    } catch (err) {
      console.error("Failed to create reservation:", err);
      toast.error("Failed to create reservation");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-14 w-full max-w-md rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
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
            Booking Management
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reservations
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Manage upcoming stays, create new bookings, and overview guest schedules.
        </p>
      </div>

      {/* ─── ACTION BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, reference, or room..."
            className="pl-10 h-12 rounded-full bg-muted/40 border-border/50 focus-visible:ring-primary/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button className="rounded-full h-12 px-6 shadow-md hover:shadow-lg transition-all w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-3xl p-0 border-border/50">
            <div className="sticky top-0 bg-background/80 backdrop-blur-md z-10 p-6 border-b border-border/40">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">Create Reservation</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Enter guest and stay details to confirm a new booking.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Guest Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                  <User className="h-4 w-4" /> Guest Information
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">First Name</Label>
                    <Input
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Last Name</Label>
                    <Input
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Phone *</Label>
                    <Input
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Email</Label>
                    <Input
                      type="email"
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Stay Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                  <CalendarDays className="h-4 w-4" /> Stay Details
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Expected Check-in</Label>
                    <Input
                      type="datetime-local"
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.expectedCheckInAt}
                      onChange={(e) => setForm({ ...form, expectedCheckInAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Nights</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.nights}
                      onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Guests</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.guestsCount}
                      onChange={(e) => setForm({ ...form, guestsCount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Special Requests</Label>
                    <Input
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.specialRequests}
                      placeholder="e.g. Extra pillows"
                      onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mt-2">
                  <input
                    type="checkbox"
                    id="checkInNow"
                    checked={form.checkInNow}
                    onChange={(e) => setForm({ ...form, checkInNow: e.target.checked })}
                    className="h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="checkInNow" className="font-medium cursor-pointer">Check in immediately</Label>
                </div>
              </div>

              {/* Billing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                  <CreditCard className="h-4 w-4" /> Billing Overview
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Rate (per night)</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.rate}
                      onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Discount</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Taxes</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-11 rounded-xl bg-muted/20"
                      value={form.taxes}
                      onChange={(e) => setForm({ ...form, taxes: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-background/80 backdrop-blur-md p-6 border-t border-border/40 flex justify-end gap-3">
              <Button variant="outline" className="rounded-full h-11 px-6" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReservation} disabled={creating} className="rounded-full h-11 px-6">
                {creating ? "Creating..." : "Confirm Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ─── DATA TABLE ────────────────────────────────────────────── */}
      {filteredReservations.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No reservations found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search criteria or create a new booking.</p>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Upcoming Reservations ({filteredReservations.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Reference</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Guest</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Room</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Check-in</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Nights</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">Total</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right pr-6">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-mono text-xs">{res.reference}</TableCell>
                    <TableCell className="font-medium text-foreground">{res.guestName}</TableCell>
                    <TableCell>
                      {res.roomNumber ? (
                        <Badge variant="secondary" className="rounded-md font-mono text-xs bg-muted/60">
                          {res.roomNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDateTime(res.expectedCheckInAt)}</TableCell>
                    <TableCell className="text-sm">{res.nights}</TableCell>
                    <TableCell className="text-sm font-medium text-right">{formatCurrency(res.total)}</TableCell>
                    <TableCell className="text-right pr-6">
                      {Number(res.outstandingBalance) > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-destructive text-sm bg-destructive/10 px-2 py-0.5 rounded-md">
                          {formatCurrency(res.outstandingBalance)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-600 text-sm bg-emerald-500/10 px-2 py-0.5 rounded-md">
                          Settled
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
