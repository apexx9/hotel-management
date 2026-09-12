"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  CalendarDays,
  CreditCard,
  MessageSquare,
  BedDouble,
  Search,
  UserX,
  Check,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import BookingsService from "@/services/bookings.service";
import GuestsService, { type Guest } from "@/services/guests.service";
import InvoicesService from "@/services/invoices.service";
import RoomsService, { type RoomType } from "@/services/rooms.service";
import SettingsService from "@/services/settings.service";
import { getCurrency } from "@/utils/currency";
import { LoadingSpinner } from "@/components/loading-spinner";
import { cn } from "@/lib/utils";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const steps = [
  { key: "guest", label: "Guest", icon: User },
  { key: "stay", label: "Stay", icon: CalendarDays },
  { key: "financials", label: "Payment", icon: CreditCard },
] as const;

const nowDateString = () => new Date().toISOString().slice(0, 16);

const isWithinNowWindow = (dateTime: string) => {
  const arrival = new Date(dateTime).getTime();
  if (Number.isNaN(arrival)) return false;
  const now = Date.now();
  return (
    arrival >= now - 15 * 60 * 1000 && arrival <= now + 24 * 60 * 60 * 1000
  );
};

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  roomTypeId: "",
  guestsCount: 1,
  nights: 1,
  expectedCheckInAt: nowDateString(),
  rate: 0,
  discount: 0,
  discountMode: "value" as "value" | "percentage",
  taxes: 0,
  taxMode: "value" as "value" | "percentage",
  specialRequests: "",
  checkInNow: false,
  amountPaid: 0,
  paymentMethod: "cash",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function NewBookingDialog({
  open,
  onOpenChange,
  onSuccess,
}: NewBookingDialogProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [guestId, setGuestId] = useState<string>("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestSearch, setGuestSearch] = useState("");
  const [guestResults, setGuestResults] = useState<Guest[]>([]);
  const [searchingGuests, setSearchingGuests] = useState(false);
  const [availability, setAvailability] = useState<{
    availableCount: number;
    totalCandidates: number;
    blockedByDates: number;
    checkOut: string;
  } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const resolveValue = (
    amount: number,
    mode: "value" | "percentage",
    value: number,
  ) => (mode === "percentage" ? (amount * value) / 100 : value);

  const selectedRoomType = roomTypes.find(
    (type) => type.id === form.roomTypeId,
  );
  const subtotal = Number((form.rate * form.nights).toFixed(2));
  const discountAmount = Number(
    resolveValue(subtotal, form.discountMode, form.discount).toFixed(2),
  );
  const taxAmount = Number(
    resolveValue(subtotal - discountAmount, form.taxMode, form.taxes).toFixed(
      2,
    ),
  );
  const total = Number((subtotal - discountAmount + taxAmount).toFixed(2));

  const [canCheckInNow, setCanCheckInNow] = useState(false);

  const guestStepValid =
    !!selectedGuest ||
    (!!form.firstName.trim() && !!form.lastName.trim() && !!form.phone.trim());

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setLoadingRoomTypes(true);
        try {
          const [types, settings] = await Promise.all([
            RoomsService().getRoomTypes(),
            SettingsService().getSettings(),
          ]);
          setRoomTypes(types.filter((t) => t.isActive));
          setForm((current) => ({
            ...current,
            discountMode: settings.defaultDiscountType ?? "value",
            taxMode: settings.defaultTaxType ?? "value",
            discount: settings.defaultDiscountValue
              ? Number(settings.defaultDiscountValue)
              : 0,
            taxes: settings.defaultTaxValue
              ? Number(settings.defaultTaxValue)
              : 0,
          }));
        } catch (err) {
          console.error("Failed to fetch room types or settings:", err);
          toast.error("Could not load booking defaults");
        } finally {
          setLoadingRoomTypes(false);
        }
      };
      fetchData();
    } else {
      setTimeout(() => {
        setStep(0);
        setForm({
          ...initialForm,
          expectedCheckInAt: nowDateString(),
        });
        setCanCheckInNow(true);
        setGuestId("");
        setSelectedGuest(null);
        setGuestSearch("");
        setGuestResults([]);
        setAvailability(null);
        setCheckingAvailability(false);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const value = guestSearch.trim();
    const timer = setTimeout(async () => {
      if (value.length < 2) {
        setGuestResults([]);
        return;
      }
      setSearchingGuests(true);
      try {
        const results = await GuestsService().getGuests(value);
        setGuestResults(results);
      } catch {
        setGuestResults([]);
      } finally {
        setSearchingGuests(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [guestSearch, open]);

  useEffect(() => {
    if (!open) return;
    const valid =
      !!form.roomTypeId && !!form.expectedCheckInAt && Number(form.nights) >= 1;
    const timer = setTimeout(
      async () => {
        if (!valid) {
          setAvailability(null);
          setCheckingAvailability(false);
          return;
        }
        setCheckingAvailability(true);
        try {
          const res = await BookingsService().getAvailability({
            roomTypeId: form.roomTypeId,
            checkIn: form.expectedCheckInAt,
            nights: form.nights,
            guests: form.guestsCount,
            checkInNow: form.checkInNow,
          });
          setAvailability({
            availableCount: res.availableCount,
            totalCandidates: res.totalCandidates,
            blockedByDates: res.blockedByDates,
            checkOut: res.checkOut,
          });
        } catch {
          setAvailability(null);
        } finally {
          setCheckingAvailability(false);
        }
      },
      valid ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [
    open,
    form.roomTypeId,
    form.expectedCheckInAt,
    form.nights,
    form.guestsCount,
    form.checkInNow,
  ]);

  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setGuestId(guest.id);
    setForm((current) => ({
      ...current,
      firstName: guest.firstName,
      lastName: guest.lastName,
      phone: guest.phone,
      email: guest.email ?? "",
    }));
    setGuestSearch("");
    setGuestResults([]);
  };

  const handleClearGuest = () => {
    setSelectedGuest(null);
    setGuestId("");
    setForm((current) => ({
      ...current,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    }));
  };

  const handleNext = () => {
    if (step === 0 && !guestStepValid) {
      toast.error(
        "Search for an existing guest or enter the guest's first, last name and phone.",
      );
      return;
    }
    if (step === 1) {
      if (!form.roomTypeId) {
        toast.error("Please select a room type before continuing.");
        return;
      }
      if (roomTypes.length === 0) {
        toast.error(
          "No room types are configured yet. Create a room type first.",
        );
        return;
      }
      if (checkingAvailability) {
        toast.error("Still checking availability, please wait.");
        return;
      }
      if (availability && availability.availableCount === 0) {
        toast.error(
          availability.totalCandidates === 0
            ? "No room can host this stay for these dates. Pick a larger room type or fewer guests."
            : "All matching rooms are reserved for these dates. Try different dates or guests.",
        );
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    if (!form.phone || !form.nights || !form.expectedCheckInAt) {
      toast.error("Phone, nights, and check-in date are required");
      return;
    }
    if (
      availability &&
      availability.availableCount === 0 &&
      !checkingAvailability
    ) {
      toast.error("No rooms are available for the selected dates.");
      return;
    }

    setCreating(true);
    try {
      const result = await BookingsService().createBooking({
        ...form,
        guestId: guestId || undefined,
        email: form.email || undefined,
        roomTypeId: form.roomTypeId || undefined,
        discountMode: form.discountMode,
        taxMode: form.taxMode,
        specialRequests: form.specialRequests || undefined,
        paymentMethod: form.paymentMethod || undefined,
      });
      const resolvedName = result?.guest
        ? `${result.guest.firstName ?? ""} ${result.guest.lastName ?? ""}`.trim()
        : null;
      if (resolvedName) {
        toast.success(`Booking created for ${resolvedName}`);
      } else {
        toast.success("Booking created successfully");
      }
      try {
        const invoice = (result as { invoice?: { id?: string } })?.invoice;
        if (invoice?.id) {
          const html = await InvoicesService().getInvoiceReceipt(invoice.id);
          const win = window.open("", "_blank");
          if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          }
        }
      } catch {
        // non-fatal — booking succeeded
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create booking:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create booking due to a conflict.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[880px] w-[95vw] max-h-[90vh] max-h-[850px] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Create New Booking
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1.5 text-sm">
            Fill in the guest information and reservation details below.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 px-8 pt-6 pb-2 shrink-0">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <div key={s.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => done && setStep(i)}
                  disabled={!done}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : done
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        : "text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      active
                        ? "bg-white/20"
                        : done
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {done && !active ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Icon className="h-3 w-3" />
                    )}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-1 h-px w-8 sm:w-14",
                      done ? "bg-blue-500" : "bg-slate-200",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
          <motion.div
            key={step}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="min-h-full"
          >
            {step === 0 && (
              <motion.section
                variants={itemVariants}
                className="p-8 pt-6 space-y-5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Guest Information
                  </h3>
                </div>

                {selectedGuest ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                        <Check className="h-4 w-4 text-blue-600" />
                        <span>
                          {selectedGuest.firstName} {selectedGuest.lastName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearGuest}
                        className="h-8 text-blue-700 hover:bg-blue-100/60 gap-1.5"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        New guest
                      </Button>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>
                        {selectedGuest.phone}
                        {selectedGuest.email ? ` · ${selectedGuest.email}` : ""}
                      </p>
                      {selectedGuest.identificationNumber ? (
                        <p>
                          {selectedGuest.identificationType ?? "ID"}:{" "}
                          {selectedGuest.identificationNumber}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-slate-600 text-sm">
                        Search for an existing guest{" "}
                        <span className="text-slate-400">
                          (min 2 characters)
                        </span>
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={guestSearch}
                          onChange={(e) => setGuestSearch(e.target.value)}
                          placeholder="Search by name, phone, or email..."
                          className="pl-9 h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                        />
                        {searchingGuests && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <LoadingSpinner className="gap-0" text="" />
                          </div>
                        )}
                      </div>
                      {guestResults.length > 0 && (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                          {guestResults.map((guest) => (
                            <button
                              key={guest.id}
                              type="button"
                              onClick={() => handleSelectGuest(guest)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-blue-50/60 transition-colors cursor-pointer"
                            >
                              <span className="flex flex-col">
                                <span className="text-sm font-medium text-slate-800">
                                  {guest.firstName} {guest.lastName}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {guest.phone}
                                  {guest.email ? ` · ${guest.email}` : ""}
                                </span>
                              </span>
                              <span className="text-xs font-medium text-blue-600">
                                Select
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {guestSearch.trim().length >= 2 &&
                        !searchingGuests &&
                        guestResults.length === 0 && (
                          <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <UserPlus className="h-3.5 w-3.5" />
                            No match found. Fill in the details below to add a
                            new guest.
                          </p>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <Label className="text-slate-600 text-sm">
                          First Name
                        </Label>
                        <Input
                          value={form.firstName}
                          onChange={(e) =>
                            setForm({ ...form, firstName: e.target.value })
                          }
                          className="h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                          placeholder="Jane"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600 text-sm">
                          Last Name
                        </Label>
                        <Input
                          value={form.lastName}
                          onChange={(e) =>
                            setForm({ ...form, lastName: e.target.value })
                          }
                          className="h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                          placeholder="Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600 text-sm">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          required
                          className="h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-600 text-sm">Email</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          className="h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>
                  </>
                )}
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                variants={itemVariants}
                className="p-8 pt-6 space-y-5"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Stay Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-slate-600 text-sm">Room Type</Label>
                    <Select
                      value={form.roomTypeId}
                      onValueChange={(value) => {
                        const selectedType = roomTypes.find(
                          (type) => type.id === value,
                        );

                        setForm((current) => ({
                          ...current,
                          roomTypeId: value || "",
                          rate:
                            current.rate && current.rate !== 0
                              ? current.rate
                              : Number(
                                  selectedType?.basePrice ?? current.rate ?? 0,
                                ),
                        }));
                      }}
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Select room type">
                            {selectedRoomType ? selectedRoomType.name : null}
                          </SelectValue>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-100">
                        {loadingRoomTypes ? (
                          <div className="p-4">
                            <LoadingSpinner text="Loading..." />
                          </div>
                        ) : (
                          roomTypes.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={type.id}
                              className="py-2 cursor-pointer"
                            >
                              <span className="font-medium">{type.name}</span>
                              <span className="text-slate-500 ml-2">
                                — {getCurrency()} {type.basePrice}/nt
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {form.roomTypeId && (
                      <p
                        className={cn(
                          "text-xs",
                          checkingAvailability
                            ? "text-slate-400"
                            : availability && availability.availableCount > 0
                              ? "text-emerald-600"
                              : "text-amber-600",
                        )}
                      >
                        {checkingAvailability
                          ? "Checking availability for these dates…"
                          : availability
                            ? availability.availableCount > 0
                              ? `${availability.availableCount} room${availability.availableCount === 1 ? "" : "s"} available for these dates. Check-out: ${new Date(availability.checkOut).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}.`
                              : availability.totalCandidates === 0
                                ? "No room can host this stay (all inactive, out of service, or too small for the party)."
                                : "All matching rooms are already reserved for these dates. Try different dates or fewer guests."
                            : "Select a check-in date to check availability."}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 text-sm">
                      Check-in Date & Time{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={form.expectedCheckInAt}
                      onChange={(e) => {
                        const value = e.target.value;
                        const stillNow = isWithinNowWindow(value);
                        setCanCheckInNow(stillNow);
                        setForm((current) => ({
                          ...current,
                          expectedCheckInAt: value,
                          checkInNow: stillNow ? current.checkInNow : false,
                        }));
                      }}
                      required
                      className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-600 text-sm">Guests</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.guestsCount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            guestsCount: Number(e.target.value),
                          })
                        }
                        className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-600 text-sm">
                        Nights <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.nights}
                        onChange={(e) =>
                          setForm({ ...form, nights: Number(e.target.value) })
                        }
                        required
                        className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {canCheckInNow ? (
                    <label
                      htmlFor="checkInNow"
                      className={`flex items-center justify-between cursor-pointer rounded-lg border p-4 transition-all select-none ${
                        form.checkInNow
                          ? "border-blue-600 bg-blue-50/30"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-sm font-medium ${form.checkInNow ? "text-blue-700" : "text-slate-700"}`}
                        >
                          Guest is checking in now
                        </span>
                        <span className="text-xs text-slate-500">
                          Create the booking and check the guest in immediately
                          (walk-in). Room shows as occupied on save.
                        </span>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${form.checkInNow ? "border-blue-600 bg-blue-600" : "border-slate-300"}`}
                      >
                        {form.checkInNow && (
                          <svg
                            className="w-3.5 h-3.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        id="checkInNow"
                        checked={form.checkInNow}
                        onChange={(e) =>
                          setForm({ ...form, checkInNow: e.target.checked })
                        }
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-slate-600">
                          Arriving{" "}
                          {new Date(
                            form.expectedCheckInAt,
                          ).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          This is a future reservation — the guest checks in at
                          the front desk on arrival.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                variants={itemVariants}
                className="p-8 pt-6 space-y-6"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Payment & Pricing
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-slate-600">Nightly Rate</Label>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          {getCurrency()}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          value={form.rate}
                          onChange={(e) =>
                            setForm({ ...form, rate: Number(e.target.value) })
                          }
                          className="h-9 pl-7 text-right rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-slate-600">Discount</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            {form.discountMode === "percentage" ? "%" : getCurrency()}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={form.discount}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                discount: Number(e.target.value),
                              })
                            }
                            className="h-9 pl-8 text-right text-green-600 font-medium rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                          />
                        </div>
                        <Select
                          value={form.discountMode}
                          onValueChange={(value) => {
                            if (!value) return;
                            setForm({
                              ...form,
                              discountMode: value as "value" | "percentage",
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 w-20 rounded-md bg-white border-slate-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-slate-600">Taxes</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-24">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                            {form.taxMode === "percentage" ? "%" : getCurrency()}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={form.taxes}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                taxes: Number(e.target.value),
                              })
                            }
                            className="h-9 pl-8 text-right rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                          />
                        </div>
                        <Select
                          value={form.taxMode}
                          onValueChange={(value) => {
                            if (!value) return;
                            setForm({
                              ...form,
                              taxMode: value as "value" | "percentage",
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 w-20 rounded-md bg-white border-slate-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="value">Value</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-slate-600">Deposit Received</Label>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          {getCurrency()}
                        </span>
                        <Input
                          type="number"
                          min={0}
                          max={total}
                          value={form.amountPaid}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              amountPaid: Number(e.target.value),
                            })
                          }
                          className="h-9 pl-7 text-right rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-slate-600">Payment Method</Label>
                      <Select
                        value={form.paymentMethod}
                        onValueChange={(value) => {
                          if (!value) return;
                          setForm({ ...form, paymentMethod: value });
                        }}
                      >
                        <SelectTrigger className="h-9 w-32 rounded-md bg-white border-slate-200 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="mobile_money">
                            Mobile Money
                          </SelectItem>
                          <SelectItem value="bank_transfer">
                            Bank Transfer
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-600 text-sm">
                        Special Requests
                      </Label>
                      <Input
                        value={form.specialRequests}
                        onChange={(e) =>
                          setForm({ ...form, specialRequests: e.target.value })
                        }
                        placeholder="Dietary needs, late arrival..."
                        className="h-10 rounded-lg border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm"
                      />
                    </div>

                    <div className="flex items-center gap-2 pb-1 pt-1 border-b border-slate-100">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-medium text-slate-900">
                        Review
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3">
                      <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">
                        Booking Summary
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>
                          {selectedRoomType?.name ?? "Room"} · {form.nights}{" "}
                          night{form.nights === 1 ? "" : "s"}
                        </span>
                        <span className="font-medium text-slate-800">
                          {selectedRoomType?.name
                            ? form.nights +
                              " × " +
                              getCurrency() +
                              " " +
                              Number(form.rate).toFixed(2)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>{getCurrency()} {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-green-700">
                        <span>Discount</span>
                        <span>- {getCurrency()} {discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Tax</span>
                        <span>+ {getCurrency()} {taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                        <span>Total</span>
                        <span>{getCurrency()} {total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Deposit received</span>
                        <span>- {getCurrency()} {Number(form.amountPaid).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-semibold text-blue-700 border-t border-slate-200 pt-2">
                        <span>Balance due</span>
                        <span>
                          {getCurrency()}{" "}
                          {Math.max(
                            0,
                            total - Number(form.amountPaid || 0),
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 flex gap-3">
                      <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-600 leading-relaxed">
                        {selectedGuest ? (
                          <>
                            <span className="font-medium text-slate-800">
                              Guest: {selectedGuest.firstName}{" "}
                              {selectedGuest.lastName}
                            </span>
                            <br />
                            {selectedGuest.phone}
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-slate-800">
                              New guest
                            </span>
                            <br />
                            {form.firstName} {form.lastName} · {form.phone}
                          </>
                        )}
                        <br />
                        {form.checkInNow
                          ? "Will be checked in as a walk-in immediately after saving."
                          : `Arriving ${new Date(form.expectedCheckInAt).toLocaleString()}`}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-5 bg-white shrink-0 z-10 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() =>
              step === 0
                ? onOpenChange(false)
                : setStep((s) => Math.max(0, s - 1))
            }
            className="h-10 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {step < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="h-10 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors flex items-center gap-2"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={creating}
                className="h-10 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <LoadingSpinner className="gap-0" text="" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
