"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, UserRound, Plus, Phone, Mail, Globe, CreditCard, History, Shield } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import Button from "@/components/button";
import Input from "@/components/input";
import { formatCurrency } from "@/utils/hms.data";
import GuestsService, { Guest } from "@/services/guests.service";
import StaysService from "@/services/stays.service";
import { DashboardStaySummary } from "@/actions/operations";
import { toast } from "sonner";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestStays, setGuestStays] = useState<DashboardStaySummary[]>([]);
  const [isLoadingStays, setIsLoadingStays] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Guest Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("Ghanaian");
  const [idType, setIdType] = useState("Passport");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingGuest, setIsSavingGuest] = useState(false);

  const loadGuests = async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const guestsService = GuestsService();
      const data = await guestsService.getGuests(query);
      setGuests(data);
      if (data.length > 0 && !selectedGuest) {
        setSelectedGuest(data[0]);
      }
    } catch (err) {
      console.error("Failed to load guests:", err);
      setError("Failed to load guests directory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuests();
  }, []);

  useEffect(() => {
    if (!selectedGuest) {
      setGuestStays([]);
      return;
    }

    const loadStays = async () => {
      try {
        setIsLoadingStays(true);
        const staysService = StaysService();
        const stays = await staysService.getStaysByGuest(selectedGuest.id);
        setGuestStays(stays);
      } catch (err) {
        console.error("Failed to load guest stays:", err);
      } finally {
        setIsLoadingStays(false);
      }
    };

    loadStays();
  }, [selectedGuest]);

  const filteredGuests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return guests;
    return guests.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.identificationNumber && g.identificationNumber.toLowerCase().includes(q))
    );
  }, [guests, searchQuery]);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      toast.error("First name, last name, and phone number are required");
      return;
    }

    setIsSavingGuest(true);
    try {
      const guestsService = GuestsService();
      const created = await guestsService.createGuest({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        nationality: nationality.trim() || undefined,
        identificationType: idType || undefined,
        identificationNumber: idNumber.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success(`Guest ${created.firstName} ${created.lastName} created!`);
      setShowCreateModal(false);
      // Reset form
      setFirstName("");
      setLastName("");
      setPhone("");
      setEmail("");
      setIdNumber("");
      setAddress("");
      setEmergencyContact("");
      setNotes("");
      await loadGuests();
      setSelectedGuest(created);
    } catch (err) {
      console.error("Failed to create guest:", err);
      toast.error("Failed to create guest record");
    } finally {
      setIsSavingGuest(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guests"
        title="Guest directory"
        description="Search returning guests, review stay histories, balances, identification, and profile preferences."
        actions={
          <Button
            type="button"
            variant="primary"
            text="Add new guest"
            onClick={() => setShowCreateModal(true)}
          />
        }
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#0C0332]">Add new guest profile</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Create a guest record for fast lookups during future walk-ins and reservations.
            </p>

            <form onSubmit={handleCreateGuest} className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
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
                  label="Email"
                  placeholder="eleanor@example.com"
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
                  label="ID Type"
                  value={idType}
                  onValueChange={setIdType}
                  options={[
                    { value: "Passport", label: "Passport" },
                    { value: "National ID", label: "National ID" },
                    { value: "Driver License", label: "Driver License" },
                  ]}
                />
                <Input
                  type="text"
                  label="ID Number"
                  placeholder="GHA-88219"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
                <Input
                  type="text"
                  label="Emergency contact"
                  placeholder="+233 24 111 2200"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  text="Cancel"
                  onClick={() => setShowCreateModal(false)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  text={isSavingGuest ? "Saving..." : "Create guest"}
                  disabled={isSavingGuest}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading guest records...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <SectionCard eyebrow="Search" title="Find a guest profile">
            <div className="flex items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3">
              <Search size={16} className="text-[#8A8787]" />
              <input
                type="text"
                placeholder="Search by first name, last name, phone, email, or ID number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#A19F9F]"
              />
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard eyebrow="Directory" title={`All guest profiles (${filteredGuests.length})`}>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => {
                    const isSelected = selectedGuest?.id === guest.id;
                    return (
                      <div
                        key={guest.id}
                        onClick={() => setSelectedGuest(guest)}
                        className={`cursor-pointer rounded-2xl p-4 transition-all ${
                          isSelected
                            ? "border-2 border-[#1900FF] bg-[#F7F7FF]"
                            : "border border-[#E8E8E8] bg-[#FBFBFC] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1900FF] border border-[#E8E8E8]">
                              <UserRound size={18} />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-[#0C0332]">
                                {guest.firstName} {guest.lastName}
                              </p>
                              <p className="mt-0.5 text-[12px] text-[#6B6B6B]">
                                {guest.phone} {guest.email ? `· ${guest.email}` : ""}
                              </p>
                              <p className="text-[11px] text-[#8A8787]">
                                {guest.nationality || "Nationality not set"} · {guest.identificationType || "ID"}
                              </p>
                            </div>
                          </div>
                          <StatusChip label="profile on file" tone="neutral" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-8 text-center text-xs text-[#6B6B6B]">
                    No guest profiles found matching your search.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Profile detail"
              title={
                selectedGuest
                  ? `${selectedGuest.firstName} ${selectedGuest.lastName}`
                  : "Select a guest"
              }
            >
              <div className="space-y-4">
                {selectedGuest ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#FBFBFC] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                          <Phone size={12} className="text-[#1900FF]" />
                          <span>Phone number</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#0C0332]">
                          {selectedGuest.phone}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FBFBFC] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                          <Mail size={12} className="text-[#1900FF]" />
                          <span>Email</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#0C0332] truncate">
                          {selectedGuest.email || "None recorded"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FBFBFC] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                          <Globe size={12} className="text-[#1900FF]" />
                          <span>Nationality</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#0C0332]">
                          {selectedGuest.nationality || "Not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#FBFBFC] p-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                          <Shield size={12} className="text-[#1900FF]" />
                          <span>ID details</span>
                        </div>
                        <p className="mt-1 text-xs font-bold text-[#0C0332]">
                          {selectedGuest.identificationType || "ID"}: {selectedGuest.identificationNumber || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between pb-2">
                        <p className="text-xs font-bold text-[#0C0332]">Stay history on property</p>
                        <span className="text-[11px] font-semibold text-[#8A8787]">
                          {guestStays.length} stay(s)
                        </span>
                      </div>

                      {isLoadingStays ? (
                        <p className="text-xs text-[#6B6B6B] p-3">Loading stay history...</p>
                      ) : guestStays.length > 0 ? (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {guestStays.map((stay) => (
                            <div
                              key={stay.id}
                              className="rounded-xl border border-[#E8E8E8] bg-[#FBFBFC] p-3 text-xs"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-bold text-[#0C0332]">
                                    Stay {stay.reference} · Room {stay.roomNumber || "N/A"}
                                  </p>
                                  <p className="text-[#6B6B6B] text-[11px] mt-0.5">
                                    {stay.nights} night(s) · {formatCurrency(Number(stay.total))}
                                  </p>
                                </div>
                                <StatusChip
                                  label={stay.status.replace("_", " ")}
                                  tone={
                                    stay.status === "checked_in"
                                      ? "success"
                                      : stay.status === "checked_out"
                                      ? "neutral"
                                      : "info"
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl bg-[#FBFBFC] p-4 text-center text-xs text-[#6B6B6B]">
                          No stays recorded for this guest yet.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-8 text-center text-xs text-[#6B6B6B]">
                    Select a guest from the left directory to view full profile & stay logs.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
