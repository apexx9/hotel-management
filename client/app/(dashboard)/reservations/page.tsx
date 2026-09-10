"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatDateTime, formatCurrency } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewBookingDialog } from "@/components/dashboard/booking-dialog";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Search, CalendarClock, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RefreshButton } from "@/components/dashboard/refresh-button";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<
    string | null
  >(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    rate: 0,
    discount: 0,
    taxes: 0,
    notes: "",
    editReason: "",
  });

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const reserved = await StaysService().getStays({ status: "reserved" });
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

  const startEditReservation = (reservation: DashboardStaySummary) => {
    setEditingReservationId(reservation.id);
    setEditForm({
      rate: Number(reservation.rate ?? 0),
      discount: Number(reservation.discount ?? 0),
      taxes: Number(reservation.taxes ?? 0),
      notes: reservation.notes ?? "",
      editReason: "",
    });
  };

  const handleUpdateReservation = async () => {
    if (!editingReservationId) return;
    setUpdating(true);
    try {
      await BookingsService().updateBooking(editingReservationId, {
        rate: editForm.rate,
        discount: editForm.discount,
        taxes: editForm.taxes,
        notes: editForm.notes || undefined,
        editReason: editForm.editReason,
      });
      toast.success("Reservation updated successfully");
      setEditingReservationId(null);
      setEditForm({
        rate: 0,
        discount: 0,
        taxes: 0,
        notes: "",
        editReason: "",
      });
      await fetchReservations();
    } catch (err) {
      console.error("Failed to update reservation:", err);
      toast.error("Failed to update reservation");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelReservation = async (res: DashboardStaySummary) => {
    if (!window.confirm(`Cancel booking ${res.reference} for ${res.guestName}?`))
      return;
    setCancellingId(res.id);
    try {
      const result = await BookingsService().cancelBooking(res.id);
      toast.success(
        result.refundDue > 0
          ? `Booking cancelled. Refund due: ${formatCurrency(result.refundDue)}`
          : "Booking cancelled",
      );
      await fetchReservations();
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      toast.error("Failed to cancel reservation");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <PageLoading showHeader showPills showTable />;
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/30 bg-destructive/10"
        >
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
        <div className="flex flex-col items-start md:items-end gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            Manage upcoming stays, create new bookings, and overview guest
            schedules.
          </p>
          <RefreshButton onRefresh={() => fetchReservations()} />
        </div>
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

        <Button
          className="rounded-full h-12 px-6 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Reservation
        </Button>

        <NewBookingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            setDialogOpen(false);
            fetchReservations();
          }}
        />
      </div>

      {/* ─── DATA TABLE ────────────────────────────────────────────── */}
      {filteredReservations.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">
            No reservations found
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search criteria or create a new booking.
          </p>
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
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Guest
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Room
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Check-in
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">
                    Nights
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right pr-6">
                    Outstanding
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow
                    key={res.id}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <TableCell className="font-mono text-xs">
                      {res.reference}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {res.guestName}
                    </TableCell>
                    <TableCell>
                      {res.roomNumber ? (
                        <Badge
                          variant="secondary"
                          className="rounded-md font-mono text-xs bg-muted/60"
                        >
                          {res.roomNumber}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(res.expectedCheckInAt)}
                    </TableCell>
                    <TableCell className="text-sm">{res.nights}</TableCell>
                    <TableCell className="text-sm font-medium text-right">
                      {formatCurrency(res.total)}
                    </TableCell>
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
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => startEditReservation(res)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-full"
                          disabled={cancellingId === res.id}
                          onClick={() => handleCancelReservation(res)}
                        >
                          {cancellingId === res.id ? "..." : "Cancel"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {editingReservationId && (
        <Dialog
          open={Boolean(editingReservationId)}
          onOpenChange={(open) => !open && setEditingReservationId(null)}
        >
          <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 border-border/50">
            <div className="p-6 border-b border-border/40">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Edit Reservation
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Update the booking pricing and leave a reason for the change.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Rate
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.rate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, rate: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Discount
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.discount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        discount: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Tax
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={editForm.taxes}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        taxes: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Notes
                </Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Edit Reason *
                </Label>
                <Input
                  value={editForm.editReason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, editReason: e.target.value })
                  }
                  placeholder="Reason for booking update"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-0">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setEditingReservationId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateReservation}
                disabled={updating || !editForm.editReason.trim()}
                className="rounded-full"
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
