"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import Button from "@/components/button";
import Input from "@/components/input";
import { formatCurrency } from "@/utils/hms.data";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import BookingsService from "@/services/bookings.service";
import { toast } from "sonner";

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
];

const idTypes = [
  { value: "Passport", label: "Passport" },
  { value: "National ID", label: "National ID / Ghana Card" },
  { value: "Driver License", label: "Driver License" },
  { value: "Voter ID", label: "Voter ID" },
];

export default function NewBookingPage() {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest details form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("Ghanaian");
  const [identificationType, setIdentificationType] = useState("Passport");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  // Stay details form state
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
  );
  const [discount, setDiscount] = useState("0");
  const [specialRequests, setSpecialRequests] = useState("");
  const [notes, setNotes] = useState("");
  const [checkInNow, setCheckInNow] = useState(true);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState("0");

  useEffect(() => {
    const loadData = async () => {
      try {
        const roomsService = RoomsService();
        const [roomTypesData, roomsData] = await Promise.all([
          roomsService.getRoomTypes(),
          roomsService.getRooms(),
        ]);
        setRoomTypes(roomTypesData);
        setRooms(roomsData);
        if (roomTypesData.length > 0) {
          setRoomTypeId(roomTypesData[0].id);
        }
      } catch (error) {
        console.error("Failed to load room data:", error);
        toast.error("Failed to load room catalog");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const selectedRoomType =
    roomTypes.find((rt) => rt.id === roomTypeId) || roomTypes[0] || null;

  const availableRooms = useMemo(() => {
    return rooms.filter(
      (room) =>
        (!selectedRoomType || room.roomTypeId === selectedRoomType.id) &&
        room.status === "available",
    );
  }, [rooms, selectedRoomType]);

  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) || 1);
  }, [checkIn, checkOut]);

  const baseRate = Number(selectedRoomType?.basePrice || 0);
  const roomCost = baseRate * nights;
  const tax = Math.round(roomCost * 0.15);
  const discountAmount = Number(discount || 0);
  const total = Math.max(0, roomCost + tax - discountAmount);
  const paid = Number(amountPaid || 0);
  const outstanding = Math.max(0, total - paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Please enter guest phone number");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter guest first and last name");
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingsService = BookingsService();
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        nationality: nationality.trim() || undefined,
        identificationType: identificationType || undefined,
        identificationNumber: identificationNumber.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        roomId: roomId || undefined,
        roomTypeId: selectedRoomType?.id || undefined,
        guestsCount: Number(guestsCount) || 1,
        nights,
        rate: baseRate,
        discount: discountAmount,
        taxes: tax,
        specialRequests: specialRequests.trim() || undefined,
        notes: notes.trim() || undefined,
        checkInNow,
        amountPaid: paid,
        paymentMethod,
      };

      const result = await bookingsService.createBooking(payload);
      toast.success(
        `Stay ${result.stay?.reference || ""} created successfully!`,
      );
      router.push("/front-desk");
    } catch (error) {
      console.error("Failed to create booking:", error);
      toast.error("Failed to create booking. Please check details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk"
        title="New walk-in booking"
        description="Create a stay for a guest, assign an available room, capture payment, and optionally check in immediately."
      />

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading room catalog...</p>
        </div>
      )}

      {!isLoading && (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-6">
              <SectionCard
                eyebrow="Guest information"
                title="Identity and contact"
                description="Collect the details needed to recognize the guest."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="text"
                    label="First name *"
                    placeholder="Eleanor"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    type="text"
                    label="Last name *"
                    placeholder="Vance"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <Input
                    type="tel"
                    label="Phone number *"
                    placeholder="+233 20 555 0131"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Input
                    type="email"
                    label="Email address"
                    placeholder="guest@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    type="text"
                    label="Nationality"
                    placeholder="Ghanaian"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                  <Input
                    type="drop"
                    label="Identification type"
                    value={identificationType}
                    onValueChange={setIdentificationType}
                    options={idTypes}
                  />
                  <Input
                    type="text"
                    label="Identification number"
                    placeholder="GHA-982134"
                    value={identificationNumber}
                    onChange={(e) => setIdentificationNumber(e.target.value)}
                  />
                  <Input
                    type="text"
                    label="Emergency contact"
                    placeholder="+233 24 111 2200"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Stay information"
                title="Room assignment and stay dates"
                description="Select the room category, assign an available room, and confirm the stay window."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="drop"
                    label="Room category"
                    value={roomTypeId}
                    onValueChange={(val) => {
                      setRoomTypeId(val);
                      setRoomId("");
                    }}
                    options={roomTypes.map((rt) => ({
                      value: rt.id,
                      label: `${rt.name} · ${formatCurrency(Number(rt.basePrice))}`,
                    }))}
                  />
                  <Input
                    type="drop"
                    label="Specific room (optional)"
                    placeholder="Auto-assign available room"
                    value={roomId}
                    onValueChange={setRoomId}
                    options={[
                      { value: "", label: "Auto-assign available room" },
                      ...availableRooms.map((r) => ({
                        value: r.id,
                        label: `Room ${r.number} (Floor ${r.floor})`,
                      })),
                    ]}
                  />
                  <Input
                    type="number"
                    label="Number of guests"
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                  />
                  <Input
                    type="date"
                    label="Check-in date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                  <Input
                    type="date"
                    label="Expected checkout"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Discount (GHS)"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Input
                    type="text"
                    label="Special requests"
                    placeholder="Quiet room, extra pillows, late checkout"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    wrapperClassName="md:col-span-2"
                  />
                  <Input
                    type="text"
                    label="Booking notes"
                    placeholder="Internal notes for the front desk team"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    wrapperClassName="md:col-span-2"
                  />

                  <div className="md:col-span-2 mt-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-[#0C0332] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checkInNow}
                        onChange={(e) => setCheckInNow(e.target.checked)}
                        className="rounded border-[#E8E8E8] text-[#1900FF] focus:ring-[#1900FF]"
                      />
                      <span>Check in guest immediately (mark room occupied)</span>
                    </label>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Payment information"
                title="Settle the booking"
                description="Record initial payment up front or leave the stay partially paid."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="drop"
                    label="Payment method"
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    options={paymentMethods}
                  />
                  <Input
                    type="number"
                    label="Amount paid now (GHS)"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
              </SectionCard>
            </div>

            <SectionCard
              eyebrow="Summary"
              title="Booking calculation"
              description="Review the calculated totals before creating the stay."
            >
              <div className="space-y-4">
                {selectedRoomType && (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Selected room category
                    </p>
                    <p className="mt-2 text-[18px] font-bold text-[#0C0332]">
                      {selectedRoomType.name}
                    </p>
                    <p className="mt-1 text-[12px] text-[#6B6B6B]">
                      {selectedRoomType.capacity} guest capacity ·{" "}
                      {selectedRoomType.bedConfiguration || "Standard bed"}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Nights", nights.toString()],
                    ["Room rate / night", formatCurrency(baseRate)],
                    ["Room cost", formatCurrency(roomCost)],
                    ["Tax (15%)", formatCurrency(tax)],
                    ["Discount", `-${formatCurrency(discountAmount)}`],
                    ["Total", formatCurrency(total)],
                    ["Paid now", formatCurrency(paid)],
                    ["Outstanding", formatCurrency(outstanding)],
                  ].map(([label, value]) => (
                    <div
                      key={label as string}
                      className="rounded-2xl bg-[#FBFBFC] p-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        {label}
                      </p>
                      <p className="mt-2 text-[13px] font-bold text-[#0C0332]">
                        {value as string}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-[#E8E8E8] bg-[#F7F7FF] p-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={14} className="text-[#1900FF]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Workflow & Persistence
                    </p>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#6B6B6B]">
                    Creating this stay persists the guest profile, assigns the
                    room, creates the invoice, logs financial payments, and sets
                    the room state to {checkInNow ? "occupied" : "reserved"}.
                  </p>
                </div>

                <div className="grid gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    text={isSubmitting ? "Creating stay..." : "Confirm and create stay"}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    text="Cancel"
                    onClick={() => router.push("/front-desk")}
                  />
                </div>
              </div>
            </SectionCard>
          </div>
        </form>
      )}
    </div>
  );
}
