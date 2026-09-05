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
} from "lucide-react";
import { toast } from "sonner";
import BookingsService from "@/services/bookings.service";
import InvoicesService from "@/services/invoices.service";
import RoomsService from "@/services/rooms.service";
import { LoadingSpinner } from "@/components/loading-spinner";

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  roomTypeId: "",
  guestsCount: 1,
  nights: 1,
  expectedCheckInAt: new Date().toISOString().slice(0, 16),
  rate: 0,
  discount: 0,
  taxes: 0,
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
  const [form, setForm] = useState(initialForm);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchRoomTypes = async () => {
        setLoadingRoomTypes(true);
        try {
          const types = await RoomsService().getRoomTypes();
          setRoomTypes(types.filter((t) => t.isActive));
        } catch (err) {
          console.error("Failed to fetch room types:", err);
          toast.error("Could not load room types");
        } finally {
          setLoadingRoomTypes(false);
        }
      };
      fetchRoomTypes();
    } else {
      setTimeout(() => setForm(initialForm), 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.phone || !form.nights || !form.expectedCheckInAt) {
      toast.error("Phone, nights, and check-in date are required");
      return;
    }
    setCreating(true);
    try {
      const result = await BookingsService().createBooking({
        ...form,
        email: form.email || undefined,
        roomTypeId: form.roomTypeId || undefined,
        specialRequests: form.specialRequests || undefined,
        paymentMethod: form.paymentMethod || undefined,
      });
      toast.success("Booking created successfully");
      // open receipt preview for generated invoice when available
      try {
        const invoice = (result as any)?.invoice;
        if (invoice?.id) {
          const html = await InvoicesService().getInvoiceReceipt(invoice.id);
          const win = window.open("", "_blank");
          if (win) {
            win.document.open();
            win.document.write(html);
            win.document.close();
          }
        }
      } catch (err) {
        // non-fatal — booking succeeded
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create booking:", err);
      toast.error("Failed to create booking");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[90vh] max-h-[850px] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
        {/* Header */}
        <DialogHeader className="px-8 pt-8 pb-4 border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Create New Booking
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1.5 text-sm">
            Fill in the guest information and reservation details below.
          </DialogDescription>
        </DialogHeader>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-col lg:flex-row min-h-full"
          >
            {/* LEFT COLUMN: Guest Info */}
            <div className="flex-1 p-8 pt-6 space-y-8">
              <motion.section variants={itemVariants} className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Guest Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-slate-600 text-sm">First Name</Label>
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
                    <Label className="text-slate-600 text-sm">Last Name</Label>
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
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Preferences
                  </h3>
                </div>
                <div className="space-y-5">
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
                        Check In Immediately
                      </span>
                      <span className="text-xs text-slate-500">
                        Update guest status to checked-in upon saving.
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
                </div>
              </motion.section>
            </div>

            {/* RIGHT COLUMN: Reservation & Financials */}
            <div className="w-full lg:w-[420px] bg-slate-50/50 border-l border-slate-100 p-8 pt-6 flex flex-col gap-8 shrink-0">
              <motion.section variants={itemVariants} className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Stay Details
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-slate-600 text-sm">Room Type</Label>
                    <Select
                      value={form.roomTypeId || ""}
                      onValueChange={(value) =>
                        setForm({ ...form, roomTypeId: value || "" })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-sm">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-slate-400" />
                          <SelectValue placeholder="Select room type" />
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
                                — ${type.basePrice}/nt
                              </span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600 text-sm">
                      Check-in Date & Time{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={form.expectedCheckInAt}
                      onChange={(e) =>
                        setForm({ ...form, expectedCheckInAt: e.target.value })
                      }
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
              </motion.section>

              <motion.section variants={itemVariants} className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-medium text-slate-900">
                    Financials
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-slate-600">Nightly Rate</Label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        $
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
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={form.discount}
                        onChange={(e) =>
                          setForm({ ...form, discount: Number(e.target.value) })
                        }
                        className="h-9 pl-7 text-right text-green-600 font-medium rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-slate-600">Taxes</Label>
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        min={0}
                        value={form.taxes}
                        onChange={(e) =>
                          setForm({ ...form, taxes: Number(e.target.value) })
                        }
                        className="h-9 pl-7 text-right rounded-md bg-white border-slate-200 focus:border-blue-600 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 bg-white shrink-0 z-10 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            Cancel
          </Button>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                "Save Booking"
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
