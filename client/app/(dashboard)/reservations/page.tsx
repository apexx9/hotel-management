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
import { AlertCircle, Plus, Search, CalendarClock } from "lucide-react";
import { toast } from "sonner";

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reservations</h1>
          <p className="text-sm text-muted-foreground">
            Manage upcoming and past reservations.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Reservation</DialogTitle>
              <DialogDescription>
                Enter guest and stay details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Check-in</Label>
                  <Input
                    type="datetime-local"
                    value={form.expectedCheckInAt}
                    onChange={(e) => setForm({ ...form, expectedCheckInAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nights</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.nights}
                    onChange={(e) => setForm({ ...form, nights: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Guests</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.guestsCount}
                    onChange={(e) => setForm({ ...form, guestsCount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate (per night)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taxes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.taxes}
                    onChange={(e) => setForm({ ...form, taxes: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Special Requests</Label>
                <Input
                  value={form.specialRequests}
                  onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="checkInNow"
                  checked={form.checkInNow}
                  onChange={(e) => setForm({ ...form, checkInNow: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="checkInNow">Check in immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReservation} disabled={creating}>
                {creating ? "Creating..." : "Create Reservation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reservations..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reservations found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Upcoming Reservations ({filteredReservations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.reference}</TableCell>
                    <TableCell>{res.guestName}</TableCell>
                    <TableCell>{res.roomNumber || "—"}</TableCell>
                    <TableCell>{formatDateTime(res.expectedCheckInAt)}</TableCell>
                    <TableCell>{res.nights}</TableCell>
                    <TableCell>{formatCurrency(res.total)}</TableCell>
                    <TableCell>
                      <span className={Number(res.outstandingBalance) > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(res.outstandingBalance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
