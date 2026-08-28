"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList, LogIn, LogOut, Search, BedDouble, AlertCircle } from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import MetricCard from "@/components/operations/metric-card";
import StatusChip from "@/components/operations/status-chip";
import { formatCurrency } from "@/utils/hms.data";
import RoomsService, { Room } from "@/services/rooms.service";
import StaysService from "@/services/stays.service";
import { DashboardStaySummary } from "@/actions/operations";

export default function FrontDeskPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const roomsService = RoomsService();
      const staysService = StaysService();
      const [roomsData, staysData] = await Promise.all([
        roomsService.getRooms(),
        staysService.getStays(),
      ]);
      setRooms(roomsData);
      setStays(staysData);
    } catch (err) {
      console.error("Failed to load front desk data:", err);
      setError("Failed to load front desk data from backend");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const arrivals = useMemo(
    () => stays.filter((stay) => stay.status === "pending_arrival" || stay.status === "reserved"),
    [stays]
  );
  const departures = useMemo(
    () => stays.filter((stay) => stay.status === "checked_in"),
    [stays]
  );
  const currentGuests = useMemo(
    () => stays.filter((stay) => stay.status === "checked_in"),
    [stays]
  );
  const pendingBalances = useMemo(
    () => stays.filter((stay) => Number(stay.outstandingBalance) > 0),
    [stays]
  );
  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === "available"),
    [rooms]
  );
  const attentionRooms = useMemo(
    () => rooms.filter((room) =>
      ["cleaning", "inspection", "maintenance", "out_of_service"].includes(room.status)
    ),
    [rooms]
  );

  const filteredStays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return stays.filter(
      (s) =>
        s.reference.toLowerCase().includes(q) ||
        (s.guestName && s.guestName.toLowerCase().includes(q)) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(q))
    );
  }, [stays, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Front desk"
        title="Operational workspace"
        description="Handle arrivals, departures, room assignment, guest lookup, and urgent desk tasks without leaving the desk."
        actions={
          <>
            <Link
              href="/front-desk/new-booking"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1900FF] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1500cc]"
            >
              New booking <ArrowRight size={14} />
            </Link>
            <Link
              href="/front-desk/check-in"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-xs font-bold text-[#0C0332] transition-colors hover:border-[#1900FF] hover:text-[#1900FF]"
            >
              Check-in
            </Link>
            <Link
              href="/front-desk/check-out"
              className="inline-flex items-center gap-2 rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-xs font-bold text-[#0C0332] transition-colors hover:border-[#1900FF] hover:text-[#1900FF]"
            >
              Check-out
            </Link>
          </>
        }
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading front desk operations...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              label="Available rooms"
              value={availableRooms.length.toString()}
              detail="Ready for immediate assignment"
              icon={LogIn}
            />
            <MetricCard
              label="Pending arrivals"
              value={arrivals.length.toString()}
              detail="Reserved & incoming guests"
              icon={ClipboardList}
            />
            <MetricCard
              label="Active stays"
              value={currentGuests.length.toString()}
              detail="Guests currently on property"
              icon={LogOut}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard
              eyebrow="Quick search"
              title="Find a guest, stay, or room"
              description="Search by name, room number, or stay reference."
            >
              <div className="flex items-center gap-3 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3">
                <Search size={16} className="text-[#8A8787]" />
                <input
                  type="text"
                  placeholder="Search guest name, stay reference (e.g. ST-), room number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-[#A19F9F]"
                />
              </div>

              {searchQuery && (
                <div className="mt-3 space-y-2">
                  {filteredStays.length > 0 ? (
                    filteredStays.map((stay) => (
                      <div
                        key={stay.id}
                        className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-white p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#0C0332]">
                            {stay.guestName || "Guest"} · Room {stay.roomNumber || "Unassigned"}
                          </p>
                          <p className="text-[#6B6B6B]">
                            Stay {stay.reference} · {stay.nights} night(s) · {formatCurrency(Number(stay.outstandingBalance))} balance
                          </p>
                        </div>
                        <StatusChip
                          label={stay.status.replace("_", " ")}
                          tone={stay.status === "checked_in" ? "success" : "info"}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6B6B6B] p-2">No matching stays found.</p>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Incoming arrivals", arrivals.length],
                  ["Active on property", currentGuests.length],
                  ["Unsettled balances", pendingBalances.length],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0C0332]">
                      {value as number}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Quick actions"
              title="Front desk workflow"
              description="Move guests seamlessly through arrival, in-stay services, and departure."
            >
              <div className="space-y-3">
                {[
                  {
                    label: "New walk-in booking",
                    href: "/front-desk/new-booking",
                    icon: ClipboardList,
                    desc: "Register walk-in guest & create stay",
                  },
                  {
                    label: "Check-in incoming guest",
                    href: "/front-desk/check-in",
                    icon: LogIn,
                    desc: "Verify identity & activate room",
                  },
                  {
                    label: "Process check-out",
                    href: "/front-desk/check-out",
                    icon: LogOut,
                    desc: "Review balance & vacate room",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] px-4 py-3 transition-colors hover:border-[#1900FF] hover:bg-white"
                    >
                      <span className="inline-flex items-center gap-3 text-sm font-semibold text-[#0C0332]">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F7F7FF] text-[#1900FF]">
                          <Icon size={16} />
                        </span>
                        <div>
                          <p>{item.label}</p>
                          <p className="text-[11px] font-normal text-[#6B6B6B]">{item.desc}</p>
                        </div>
                      </span>
                      <ArrowRight size={15} className="text-[#A19F9F]" />
                    </Link>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              eyebrow="Arrivals"
              title="Incoming guests"
              action={
                <Link href="/front-desk/check-in" className="text-xs font-bold text-[#1900FF] hover:underline">
                  Check-in queue
                </Link>
              }
            >
              <div className="space-y-3">
                {arrivals.length > 0 ? (
                  arrivals.map((stay) => (
                    <div key={stay.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-[#0C0332]">
                            {stay.guestName || "Guest"}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6B6B6B]">
                            Stay {stay.reference} · Room {stay.roomNumber || "Unassigned"}
                          </p>
                          <p className="text-[11px] text-[#8A8787]">
                            {stay.roomTypeName || "Standard"} · {stay.nights} night(s)
                          </p>
                        </div>
                        <StatusChip label={stay.status.replace("_", " ")} tone="info" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No arrivals scheduled.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Departures"
              title="Active stays / Departures"
              action={
                <Link href="/front-desk/check-out" className="text-xs font-bold text-[#1900FF] hover:underline">
                  Check-out
                </Link>
              }
            >
              <div className="space-y-3">
                {departures.length > 0 ? (
                  departures.map((stay) => (
                    <div key={stay.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-[#0C0332]">
                            {stay.guestName || "Guest"}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6B6B6B]">
                            Room {stay.roomNumber || "N/A"} · {formatCurrency(Number(stay.outstandingBalance) || 0)} outstanding
                          </p>
                          <p className="text-[11px] text-[#8A8787]">
                            Check-out due: {new Date(stay.expectedCheckoutAt).toLocaleDateString()}
                          </p>
                        </div>
                        <StatusChip
                          label={Number(stay.outstandingBalance) > 0 ? "balance due" : "settled"}
                          tone={Number(stay.outstandingBalance) > 0 ? "warning" : "success"}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No active stays currently on property.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Room pressure" title="Rooms needing attention">
              <div className="space-y-3">
                {attentionRooms.length > 0 ? (
                  attentionRooms.map((room) => (
                    <div key={room.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-[#0C0332]">
                            Room {room.number}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6B6B6B] capitalize">
                            Floor {room.floor} · {room.status.replace("_", " ")}
                          </p>
                        </div>
                        <StatusChip
                          label={room.status.replace("_", " ")}
                          tone={
                            room.status === "maintenance" || room.status === "out_of_service"
                              ? "danger"
                              : "warning"
                          }
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    All rooms in operational status.
                  </div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard eyebrow="In-house guests" title="Current active guests">
              <div className="space-y-3">
                {currentGuests.length > 0 ? (
                  currentGuests.map((stay) => (
                    <div key={stay.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-[#0C0332]">
                            {stay.guestName || "Guest"}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6B6B6B]">
                            Room {stay.roomNumber || "N/A"} · Stay {stay.reference}
                          </p>
                          <p className="text-[11px] text-[#8A8787]">
                            Total: {formatCurrency(Number(stay.total))} · Paid: {formatCurrency(Number(stay.amountPaid))}
                          </p>
                        </div>
                        <StatusChip label="checked in" tone="success" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No active stays on property.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Inventory" title="Available room inventory">
              <div className="grid gap-3 md:grid-cols-2">
                {availableRooms.length > 0 ? (
                  availableRooms.map((room) => (
                    <div key={room.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-bold text-[#0C0332]">
                            Room {room.number}
                          </p>
                          <p className="mt-1 text-[12px] text-[#6B6B6B]">
                            Floor {room.floor} · Capacity {room.capacity}
                          </p>
                        </div>
                        <StatusChip label="available" tone="success" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No rooms currently available for check-in.
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
