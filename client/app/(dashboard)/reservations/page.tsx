"use client";

import { useEffect, useState } from "react";
import StaysService from "@/services/stays.service";
import BookingsService from "@/services/bookings.service";
import RoomsService, { type Room } from "@/services/rooms.service";
import PaymentsService from "@/services/payments.service";
import type { DashboardStaySummary } from "@/actions/operations";
import {
  formatDateTime,
  formatDateTimeWithDate,
  formatCurrency,
} from "@/utils/utils";
import { useCurrency } from "@/utils/currency";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NewBookingDialog } from "@/components/dashboard/booking-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Plus,
  Search,
  CalendarClock,
  Info,
  Mail,
  Loader2,
  BedDouble,
  Percent,
  Check,
  ShieldCheck,
  FileText,
  MessageSquare,
  CalendarDays,
  ClipboardList,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const currency = useCurrency();
  const [editingReservationId, setEditingReservationId] = useState<
    string | null
  >(null);
  const [editingReservation, setEditingReservation] =
    useState<DashboardStaySummary | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [cancelTarget, setCancelTarget] =
    useState<DashboardStaySummary | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [editAvailability, setEditAvailability] = useState<{
    status: "idle" | "checking" | "available" | "unavailable";
    message?: string;
  }>({ status: "idle" });

  const emptyEditForm = {
    rate: 0,
    discount: 0,
    discountMode: "value" as "value" | "percentage",
    taxes: 0,
    taxMode: "value" as "value" | "percentage",
    expectedCheckInAt: "",
    nights: 1,
    roomId: "",
    specialRequests: "",
    notes: "",
    editReason: "",
  };

  const [editForm, setEditForm] = useState(emptyEditForm);
  const [initialEditForm, setInitialEditForm] = useState(emptyEditForm);

  const resolvePricing = (
    mode: "value" | "percentage",
    base: number,
    value: number,
  ) =>
    mode === "percentage"
      ? Number(((base * value) / 100).toFixed(2))
      : Number(Number(value).toFixed(2));

  const toDateTimeLocal = (value?: string | Date | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
  };

  const fetchReservations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const reserved = await StaysService().getStays({ status: "reserved" });
      setReservations(reserved);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
      if (!silent) setError("Could not load reservations. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const init = async () => {
      try {
        const [reserved, roomList] = await Promise.all([
          StaysService().getStays({ status: "reserved" }),
          RoomsService().getRooms(),
        ]);
        if (!isActive) return;
        setReservations(reserved);
        setRooms(roomList);
        setError(null);
      } catch (err) {
        console.error("Failed to load reservations page data:", err);
        if (isActive) {
          setError("Could not load reservations. Please try again.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    init();
    return () => {
      isActive = false;
    };
  }, []);

  useRealtimeRefresh(() => fetchReservations(true));

  const filteredReservations = reservations.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.guestName?.toLowerCase().includes(q) ||
      r.reference?.toLowerCase().includes(q) ||
      r.roomNumber?.toLowerCase().includes(q)
    );
  });

  const startEditReservation = (reservation: DashboardStaySummary) => {
    const next = {
      rate: Number(reservation.rate ?? 0) || 0,
      discount: Number(reservation.discount ?? 0) || 0,
      discountMode: "value" as "value" | "percentage",
      taxes: Number(reservation.taxes ?? 0) || 0,
      taxMode: "value" as "value" | "percentage",
      expectedCheckInAt: toDateTimeLocal(reservation.expectedCheckInAt),
      nights: Number(reservation.nights ?? 1) || 1,
      roomId: reservation.roomId ?? "",
      specialRequests: reservation.specialRequests ?? "",
      notes: reservation.notes ?? "",
      editReason: "",
    };
    setEditingReservationId(reservation.id);
    setEditingReservation(reservation);
    setEditForm(next);
    setInitialEditForm(next);
    setEditAvailability({ status: "idle" });
  };

  const hasEditChanges =
    Math.abs(editForm.rate - initialEditForm.rate) > 0.001 ||
    Math.abs(editForm.discount - initialEditForm.discount) > 0.001 ||
    editForm.discountMode !== initialEditForm.discountMode ||
    Math.abs(editForm.taxes - initialEditForm.taxes) > 0.001 ||
    editForm.taxMode !== initialEditForm.taxMode ||
    editForm.expectedCheckInAt !== initialEditForm.expectedCheckInAt ||
    editForm.nights !== initialEditForm.nights ||
    editForm.roomId !== initialEditForm.roomId ||
    editForm.specialRequests !== initialEditForm.specialRequests ||
    editForm.notes !== initialEditForm.notes;

  const editNights = Number(editForm.nights || 1);
  const editSubtotal = Number((editForm.rate * editNights).toFixed(2));
  const editDiscountAmount = resolvePricing(
    editForm.discountMode,
    editSubtotal,
    editForm.discount,
  );
  const editTaxAmount = resolvePricing(
    editForm.taxMode,
    Math.max(0, editSubtotal - editDiscountAmount),
    editForm.taxes,
  );
  const editNewTotal = Math.max(
    0,
    Number((editSubtotal - editDiscountAmount + editTaxAmount).toFixed(2)),
  );
  const editOldTotal = Number(editingReservation?.total ?? 0);
  const editPaid = Number(editingReservation?.amountPaid ?? 0);
  const editRefundDue =
    editPaid - editNewTotal > 0.005 ? editPaid - editNewTotal : 0;
  const editRemaining = Math.max(0, editNewTotal - editPaid);
  const editTotalDiff = editNewTotal - editOldTotal;

  const moveRooms = rooms.filter(
    (r) =>
      r.status === "available" ||
      r.status === "reserved" ||
      r.id === editForm.roomId,
  );

  const buildRoomLabel = (room: Room) =>
    `Room ${room.number}${room.floor ? ` · Floor ${room.floor}` : ""}${
      room.status !== "available" && room.status !== "reserved"
        ? ` · ${room.status.replace("_", " ")}`
        : ""
    }`;

  const moveRoomItems = moveRooms.map((room) => ({
    value: room.id,
    label: buildRoomLabel(room),
  }));

  useEffect(() => {
    const shouldCheck =
      Boolean(editingReservation) &&
      Boolean(editForm.expectedCheckInAt) &&
      Boolean(editForm.roomId) &&
      (editForm.expectedCheckInAt !== initialEditForm.expectedCheckInAt ||
        editForm.nights !== initialEditForm.nights ||
        editForm.roomId !== initialEditForm.roomId);

    const timer = window.setTimeout(
      async () => {
        if (!shouldCheck) {
          setEditAvailability({ status: "idle" });
          return;
        }
        setEditAvailability({ status: "checking" });
        try {
          const result = await BookingsService().getAvailability({
            roomId: editForm.roomId,
            checkIn: new Date(editForm.expectedCheckInAt).toISOString(),
            nights: editForm.nights,
            guests: editingReservation?.guestsCount ?? 1,
            checkInNow: false,
            excludeStayId: editingReservation?.id,
          });
          if (result.availableCount > 0) {
            setEditAvailability({
              status: "available",
              message: "Room is available for these dates.",
            });
          } else {
            setEditAvailability({
              status: "unavailable",
              message:
                "Room is not available for the updated dates or nights — adjust them or choose another room.",
            });
          }
        } catch {
          setEditAvailability({ status: "idle" });
        }
      },
      shouldCheck ? 400 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [
    editForm.expectedCheckInAt,
    editForm.nights,
    editForm.roomId,
    editingReservation,
    initialEditForm,
  ]);

  const handleUpdateReservation = async () => {
    if (!editingReservationId) return;
    setUpdating(true);
    try {
      await BookingsService().updateBooking(editingReservationId, {
        rate: editForm.rate,
        discount: editForm.discount,
        discountMode: editForm.discountMode,
        taxes: editForm.taxes,
        taxMode: editForm.taxMode,
        expectedCheckInAt: editForm.expectedCheckInAt
          ? new Date(editForm.expectedCheckInAt).toISOString()
          : undefined,
        nights: editForm.nights,
        specialRequests: editForm.specialRequests || undefined,
        roomId: editForm.roomId || undefined,
        notes: editForm.notes || undefined,
        editReason: editForm.editReason,
      });
      toast.success("Reservation updated successfully");
      setEditingReservationId(null);
      setEditForm(emptyEditForm);
      setEditAvailability({ status: "idle" });
      await fetchReservations();
    } catch (err) {
      console.error("Failed to update reservation:", err);
      toast.error("Failed to update reservation");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendConfirmation = async (res: DashboardStaySummary) => {
    setSendingEmailId(res.id);
    try {
      const result = await BookingsService().sendConfirmation(res.id);
      if (result?.ok) {
        if (result?.skipped) {
          toast.info(
            result.info ??
              "Email delivery is not configured — confirmation was not sent",
          );
        } else {
          toast.success(
            result.to
              ? `Confirmation sent to ${result.to}`
              : "Confirmation email sent",
          );
        }
      } else {
        toast.error(result?.info ?? "Failed to send confirmation email");
      }
      await fetchReservations(true);
    } catch (err) {
      console.error("Failed to send confirmation:", err);
      toast.error(
        "Failed to send confirmation. Please check email settings and try again.",
      );
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleCancelReservation = async (res: DashboardStaySummary) => {
    setCancelTarget(res);
  };

  const confirmCancelReservation = async () => {
    if (!cancelTarget) return;
    setCancellingId(cancelTarget.id);
    try {
      const result = await BookingsService().cancelBooking(cancelTarget.id);
      toast.success(
        result.refundDue > 0
          ? `Booking cancelled. Refund due: ${formatCurrency(
              result.refundDue,
              currency,
            )}`
          : "Booking cancelled",
      );
      setCancelTarget(null);
      await fetchReservations(true);
    } catch (err) {
      console.error("Failed to cancel reservation:", err);
      toast.error("Failed to cancel reservation");
    } finally {
      setCancellingId(null);
    }
  };

  const handleRecordRefund = async () => {
    if (!editingReservation || editRefundDue <= 0) return;
    setRefunding(true);
    try {
      await PaymentsService().recordRefund({
        stayId: editingReservation.id,
        amount: editRefundDue,
        method: refundMethod,
        notes: `Refund from booking edit (${editingReservation.reference})`,
      });
      toast.success(
        `Refund of ${formatCurrency(editRefundDue, currency)} recorded`,
      );
      setEditingReservation({
        ...editingReservation,
        amountPaid: String(
          Math.max(
            0,
            Number(editingReservation.amountPaid ?? 0) - editRefundDue,
          ),
        ),
      });
      await fetchReservations(true);
    } catch (err) {
      console.error("Failed to record refund:", err);
      toast.error("Failed to record refund");
    } finally {
      setRefunding(false);
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
                      {res.confirmationEmailSentAt && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          Emailed {formatDateTime(res.confirmationEmailSentAt)}
                        </span>
                      )}
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
                      {formatDateTimeWithDate(res.expectedCheckInAt)}
                    </TableCell>
                    <TableCell className="text-sm">{res.nights}</TableCell>
                    <TableCell className="text-sm font-medium text-right">
                      {formatCurrency(res.total, currency)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {Number(res.outstandingBalance) > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-destructive text-sm bg-destructive/10 px-2 py-0.5 rounded-md">
                          {formatCurrency(res.outstandingBalance, currency)}
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
                          disabled={sendingEmailId === res.id}
                          onClick={() => handleSendConfirmation(res)}
                          title={
                            res.guestEmail
                              ? `Email confirmation to ${res.guestEmail}`
                              : "No guest email on file"
                          }
                        >
                          {sendingEmailId === res.id ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Mail className="mr-1 h-3.5 w-3.5" />
                          )}
                          {res.confirmationEmailSentAt ? "Resend" : "Email"}
                        </Button>
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
          onOpenChange={(open) => {
            if (!open) {
              setEditingReservationId(null);
              setEditAvailability({ status: "idle" });
            }
          }}
        >
          <DialogContent className="sm:max-w-[620px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
            {/* ─── HEADER ─────────────────────────────────────────── */}
            <div className="bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Edit reservation
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {editingReservation && (
                    <>
                      <span className="font-semibold text-slate-800">
                        {editingReservation.guestName || "Unknown guest"}
                      </span>
                      <span className="text-slate-500">
                        {" "}
                        · Room {editingReservation.roomNumber || "—"}
                      </span>
                      <span className="text-slate-400 font-mono text-xs">
                        {" "}
                        · {editingReservation.reference}
                      </span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              {editingReservation && (
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500">
                  {editingReservation.roomTypeName && (
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                      {editingReservation.roomTypeName}
                    </span>
                  )}
                  {editingReservation.guestEmail && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {editingReservation.guestEmail}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                    {formatDateTime(editingReservation.expectedCheckInAt)} ·{" "}
                    {editingReservation.nights}{" "}
                    {editingReservation.nights === 1 ? "night" : "nights"}
                  </span>
                </div>
              )}
            </div>

            {/* ─── BODY ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="p-6 space-y-6">
                {/* ── STAY DETAILS ──────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Stay details
                    </h3>
                  </div>

                  <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-sm font-medium">
                          Check-in date & time
                        </Label>
                        <Input
                          type="datetime-local"
                          value={editForm.expectedCheckInAt}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              expectedCheckInAt: e.target.value,
                            })
                          }
                          className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-sm font-medium">
                          Nights
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={editForm.nights}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              nights: Number(e.target.value) || 1,
                            })
                          }
                          className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700 text-sm font-medium">
                        Room
                      </Label>
                      <Select
                        value={editForm.roomId}
                        items={moveRoomItems}
                        onValueChange={(value) => {
                          if (!value) return;
                          setEditForm({ ...editForm, roomId: value });
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 shadow-sm">
                          <SelectValue placeholder="Select a room" />
                        </SelectTrigger>
                        <SelectContent>
                          {moveRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {buildRoomLabel(room)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Changing the room releases the current room and
                        reassigns availability automatically.
                      </p>
                    </div>

                    {editAvailability.status !== "idle" && (
                      <div
                        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                          editAvailability.status === "checking"
                            ? "bg-slate-100 text-slate-600"
                            : editAvailability.status === "available"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {editAvailability.status === "checking" ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : editAvailability.status === "available" ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        )}
                        <span>
                          {editAvailability.status === "checking"
                            ? "Checking availability…"
                            : editAvailability.message}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── PRICING ──────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BedDouble className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Pricing
                    </h3>
                  </div>

                  <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">
                          Nightly Rate
                        </Label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {editNights} night{editNights === 1 ? "" : "s"} ·
                          subtotal {formatCurrency(editSubtotal, currency)}
                        </p>
                      </div>
                      <div className="relative w-36 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          {currency}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={editForm.rate}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              rate: Number(e.target.value),
                            })
                          }
                          className="h-10 pl-10 pr-3 text-right font-medium rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">
                          Discount
                        </Label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {editForm.discountMode === "percentage"
                            ? `${editForm.discount}% of subtotal = ${formatCurrency(
                                editDiscountAmount,
                                currency,
                              )}`
                            : "Flat amount off the subtotal"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            {editForm.discountMode === "percentage"
                              ? "%"
                              : currency}
                          </span>
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
                            className="h-10 pl-8 pr-3 text-right rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm"
                          />
                        </div>
                        <Select
                          value={editForm.discountMode}
                          items={[
                            { value: "value", label: "Value" },
                            { value: "percentage", label: "Percent" },
                          ]}
                          onValueChange={(value) => {
                            if (!value) return;
                            setEditForm({
                              ...editForm,
                              discountMode: value as "value" | "percentage",
                            });
                          }}
                        >
                          <SelectTrigger className="h-10 w-24 rounded-lg bg-white border-slate-200 focus:border-blue-600 shadow-sm text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="percentage">
                              <span className="inline-flex items-center gap-1.5">
                                <Percent className="h-3.5 w-3.5" />
                                Percent
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">
                          Tax
                        </Label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {editForm.taxMode === "percentage"
                            ? `${editForm.taxes}% after discount = ${formatCurrency(
                                editTaxAmount,
                                currency,
                              )}`
                            : "Flat tax / fee added to the total"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            {editForm.taxMode === "percentage"
                              ? "%"
                              : currency}
                          </span>
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
                            className="h-10 pl-8 pr-3 text-right rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm"
                          />
                        </div>
                        <Select
                          value={editForm.taxMode}
                          items={[
                            { value: "value", label: "Value" },
                            { value: "percentage", label: "Percent" },
                          ]}
                          onValueChange={(value) => {
                            if (!value) return;
                            setEditForm({
                              ...editForm,
                              taxMode: value as "value" | "percentage",
                            });
                          }}
                        >
                          <SelectTrigger className="h-10 w-24 rounded-lg bg-white border-slate-200 focus:border-blue-600 shadow-sm text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="percentage">
                              <span className="inline-flex items-center gap-1.5">
                                <Percent className="h-3.5 w-3.5" />
                                Percent
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SUMMARY ──────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Summary
                    </h3>
                  </div>

                  <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">
                        Subtotal · {editForm.rate} × {editNights} nights
                      </span>
                      <span className="font-medium text-slate-800">
                        {formatCurrency(editSubtotal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-medium text-emerald-700">
                        − {formatCurrency(editDiscountAmount, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tax</span>
                      <span className="font-medium text-slate-800">
                        + {formatCurrency(editTaxAmount, currency)}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800">New total</span>
                      <span className="text-slate-900">
                        {formatCurrency(editNewTotal, currency)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        Old total ·{" "}
                        <span className="line-through opacity-70">
                          {formatCurrency(editOldTotal, currency)}
                        </span>
                      </span>
                      {Math.abs(editTotalDiff) > 0.005 ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${
                            editTotalDiff > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {editTotalDiff > 0 ? "+" : "−"}
                          {formatCurrency(Math.abs(editTotalDiff), currency)}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 inline-flex items-center rounded-md px-2 py-0.5 font-medium">
                          No change
                        </span>
                      )}
                    </div>

                    {editPaid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Paid so far</span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(editPaid, currency)}
                        </span>
                      </div>
                    )}

                    {editRefundDue > 0 ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs text-amber-800">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                          <span>
                            New total is{" "}
                            {formatCurrency(editNewTotal, currency)}, below the{" "}
                            {formatCurrency(editPaid, currency)} already paid —
                            a{" "}
                            <span className="font-semibold">
                              {formatCurrency(editRefundDue, currency)}
                            </span>{" "}
                            refund is due.
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <Select
                            value={refundMethod}
                            items={[
                              { value: "cash", label: "Cash" },
                              { value: "mobile_money", label: "Mobile money" },
                              { value: "card", label: "Card" },
                              { value: "bank_transfer", label: "Bank transfer" },
                            ]}
                            onValueChange={(value) => {
                              if (value) setRefundMethod(value);
                            }}
                          >
                            <SelectTrigger className="h-9 w-40 rounded-lg bg-white border-slate-200 text-xs shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="mobile_money">
                                Mobile money
                              </SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">
                                Bank transfer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handleRecordRefund}
                            disabled={refunding}
                            className="h-9 rounded-lg bg-amber-600 text-xs text-white hover:bg-amber-700 disabled:opacity-70 transition-colors"
                          >
                            <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                            {refunding ? "Recording…" : "Record refund"}
                          </Button>
                        </div>
                      </div>
                    ) : editRemaining > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Balance due after save
                        </span>
                        <span className="font-medium text-slate-800">
                          {formatCurrency(editRemaining, currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                        <Check className="h-4 w-4" />
                        Fully settled once saved.
                      </div>
                    )}
                  </div>
                </div>

                {/* ── NOTES ────────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Notes
                    </h3>
                  </div>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Internal notes about this reservation…"
                    rows={3}
                    className="w-full resize-none rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus-visible:outline-none"
                  />
                </div>

                {/* ── SPECIAL REQUESTS ─────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <ClipboardList className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Special requests
                    </h3>
                  </div>
                  <textarea
                    value={editForm.specialRequests}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        specialRequests: e.target.value,
                      })
                    }
                    placeholder="e.g. high floor, airport pickup, late checkout on the last day…"
                    rows={2}
                    className="w-full resize-none rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus-visible:outline-none"
                  />
                </div>

                {/* ── EDIT REASON ───────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-medium text-slate-900">
                      Edit reason{" "}
                      <span className="text-red-500 font-semibold">*</span>
                    </h3>
                  </div>
                  <textarea
                    value={editForm.editReason}
                    onChange={(e) =>
                      setEditForm({ ...editForm, editReason: e.target.value })
                    }
                    placeholder="Why is this reservation being changed? (e.g. guest requested a lower rate)"
                    rows={3}
                    className="w-full resize-none rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus-visible:outline-none"
                  />
                  <p className="text-xs text-slate-500">
                    Saved to the activity log so the booking history stays
                    auditable.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── FOOTER ──────────────────────────────────────── */}
            <div className="shrink-0 border-t border-slate-100 p-5 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
              {!hasEditChanges && editForm.editReason.trim() ? (
                <p className="mr-auto self-center text-xs text-slate-500">
                  Nothing to save yet — tweak a value first.
                </p>
              ) : hasEditChanges && !editForm.editReason.trim() ? (
                <p className="mr-auto self-center text-xs text-slate-500">
                  Add an edit reason to save.
                </p>
              ) : null}
              <Button
                variant="outline"
                className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
                onClick={() => setEditingReservationId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateReservation}
                disabled={
                  updating || !hasEditChanges || !editForm.editReason.trim()
                }
                className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
              >
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {cancelTarget && (
        <Dialog
          open
          onOpenChange={(open) => !open && setCancelTarget(null)}
        >
          <DialogContent className="sm:max-w-[440px] max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
            <div className="bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                  Cancel reservation?
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Cancel booking{" "}
                  <span className="font-mono text-slate-700">
                    {cancelTarget.reference}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold text-slate-800">
                    {cancelTarget.guestName || "this guest"}
                  </span>
                  ?
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  Cancellation is permanent and cannot be undone. Any
                  overpayment will be reported as a refund due after
                  cancellation.
                </span>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-100 p-5 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
              <Button
                variant="outline"
                className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
                onClick={() => setCancelTarget(null)}
              >
                Keep booking
              </Button>
              <Button
                onClick={confirmCancelReservation}
                disabled={cancellingId === cancelTarget.id}
                className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 transition-colors"
              >
                {cancellingId === cancelTarget.id ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Cancelling…
                  </>
                ) : (
                  "Cancel booking"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
