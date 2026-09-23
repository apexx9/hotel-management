"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import StaysService from "@/services/stays.service";
import type { DashboardStaySummary } from "@/actions/operations";
import { formatDateTime } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CalendarDays,
  BedDouble,
  DoorOpen,
  Info,
  Layers,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVE_AT_STATUSES = ["reserved", "pending_arrival", "checked_in"];

interface DayAvailability {
  kind: "available" | "in_house" | "checked_in" | "reserved" | "due" | "out_of_service" | "maintenance" | "cleaning";
  stay?: DashboardStaySummary;
}

function startOfDay(v: string | Date) {
  const d = new Date(v);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(v: string | Date, n: number) {
  const d = new Date(v);
  d.setDate(d.getDate() + n);
  return d;
}

function stayCoversDate(stay: DashboardStaySummary, date: Date) {
  const checkIn = startOfDay(stay.expectedCheckInAt);
  const checkOut = addDays(checkIn, Number(stay.nights) || 1);
  return date >= checkIn && date < checkOut;
}

const kindStyle: Record<DayAvailability["kind"], { bg: string; badge: string; label: string }> = {
  available: { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-600", label: "Available" },
  in_house: { bg: "bg-blue-50 border-blue-200", badge: "bg-blue-600", label: "In-house" },
  checked_in: { bg: "bg-blue-50 border-blue-200", badge: "bg-blue-600", label: "In-house" },
  reserved: { bg: "bg-amber-50 border-amber-200", badge: "bg-amber-500", label: "Reserved" },
  due: { bg: "bg-orange-50 border-orange-200", badge: "bg-orange-600", label: "Due today" },
  cleaning: { bg: "bg-violet-50 border-violet-200", badge: "bg-violet-500", label: "Cleaning" },
  maintenance: { bg: "bg-slate-100 border-slate-300", badge: "bg-slate-400", label: "Maintenance" },
  out_of_service: { bg: "bg-slate-100 border-slate-300", badge: "bg-slate-500", label: "Out of service" },
};

export default function RoomAvailabilityPage() {
  const today = new Date();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [stays, setStays] = useState<DashboardStaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>(today.toISOString().slice(0, 10));
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsData, typesData, staysData] = await Promise.all([
          RoomsService().getRooms(),
          RoomsService().getRoomTypes(),
          StaysService().getStays(),
        ]);
        setRooms(roomsData);
        setRoomTypes(typesData);
        setStays(staysData);
      } catch (err) {
        console.error("Failed to fetch availability data:", err);
        setError("Could not load availability. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <PageLoading showHeader showPills showGrid />;
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

  const selectedDate = startOfDay(date);

  const roomTypeMap = new Map(roomTypes.map((t) => [t.id, t.name]));
  const floors = Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))) as string[];

  const activeStays = stays.filter((s) =>
    ACTIVE_AT_STATUSES.includes(s.status),
  );

  const availabilityFor = (room: Room): DayAvailability => {
    if (room.status === "maintenance") return { kind: "maintenance" };
    if (room.status === "out_of_service") return { kind: "out_of_service" };
    if (room.status === "cleaning" || room.status === "inspection") {
      return { kind: "cleaning" };
    }
    const overlapping = activeStays.find(
      (s) => s.roomId === room.id && stayCoversDate(s, selectedDate),
    );
    if (!overlapping) return { kind: "available" };
    if (overlapping.status === "checked_in") return { kind: "checked_in", stay: overlapping };
    const checkIn = startOfDay(overlapping.expectedCheckInAt);
    if (checkIn <= selectedDate) return { kind: "due", stay: overlapping };
    return { kind: "reserved", stay: overlapping };
  };

  const evaluated = rooms.map((room) => ({ room, av: availabilityFor(room) }));

  const filtered = evaluated.filter((e) => {
    const matchesFloor = floorFilter === "all" || e.room.floor === floorFilter;
    const matchesType = typeFilter === "all" || e.room.roomTypeId === typeFilter;
    return matchesFloor && matchesType;
  });

  const counts = {
    available: filtered.filter((e) => e.av.kind === "available").length,
    inHouse: filtered.filter((e) => e.av.kind === "checked_in" || e.av.kind === "due" || e.av.kind === "reserved").length,
    reserved: filtered.filter((e) => e.av.kind === "reserved" || e.av.kind === "due").length,
    busy: filtered.filter((e) => e.av.kind === "cleaning" || e.av.kind === "maintenance" || e.av.kind === "out_of_service").length,
  };

  const summaryBand = [
    { label: "Available", value: counts.available, dot: "bg-emerald-500" },
    { label: "In-house", value: counts.inHouse, dot: "bg-blue-600" },
    { label: "Reserved", value: counts.reserved, dot: "bg-amber-500" },
    { label: "Busy / OOS", value: counts.busy, dot: "bg-slate-400" },
  ];

  const legend = [
    { label: "Available", dot: "bg-emerald-600" },
    { label: "In-house", dot: "bg-blue-600" },
    { label: "Reserved / Due", dot: "bg-amber-500" },
    { label: "Cleaning", dot: "bg-violet-500" },
    { label: "Maintenance / OOS", dot: "bg-slate-400" },
  ];

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60">
            Inventory Management
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Room Availability
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Check which rooms are free, in-house, or reserved for any date.
        </p>
      </div>

      {/* ─── CONTROLS ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm space-y-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-11 w-full sm:w-56 rounded-xl border-border/60 bg-background shadow-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-border/60 bg-background shadow-sm"
            onClick={() => setDate(today.toISOString().slice(0, 10))}
          >
            Today
          </Button>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> Floor
            </label>
            <Select value={floorFilter} onValueChange={(v) => setFloorFilter(v || "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-background shadow-sm">
                <SelectValue>{(value) =>
                  !value || value === "all" ? "All floors" : `Floor ${value}`
                }</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All floors</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor}>Floor {floor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <BedDouble className="h-3.5 w-3.5" /> Type
            </label>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v || "all")}>
              <SelectTrigger className="h-11 w-full rounded-xl border-border/60 bg-background shadow-sm">
                <SelectValue>{(value) =>
                  !value || value === "all" ? "All types" : roomTypeMap.get(value) || "All types"
                }</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All types</SelectItem>
                {roomTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Summary & legend ── */}
        <div className="flex flex-col gap-4 border-t border-border/40 pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-6">
            {summaryBand.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <span className={cn("h-3 w-3 rounded-full", s.dot)} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground leading-tight">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", l.dot)} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ROOM CARDS ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Adjust your filters or add rooms on the Overview page first.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(({ room, av }) => {
            const style = kindStyle[av.kind];
            return (
              <Card key={room.id} className={cn("relative rounded-3xl border shadow-sm hover:shadow-md transition-all overflow-hidden", style.bg)}>
                <CardHeader className="pb-3 border-b border-black/5 bg-white/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", style.badge)} />
                      <CardTitle className="text-lg font-bold text-foreground">
                        Room {room.number}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 bg-white/70 text-foreground border-black/10">
                      {style.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Floor {room.floor || "—"} · {roomTypeMap.get(room.roomTypeId) || "Unknown"} · {room.capacity}pax
                  </p>
                </CardHeader>
                <CardContent className="pt-4 min-h-[104px]">
                  {av.stay ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{av.stay.guestName || "Guest"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DoorOpen className="h-3.5 w-3.5" />
                        <span className="font-mono">{av.stay.reference}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        {av.kind === "checked_in" ? (
                          <span>Departs {formatDateTime(av.stay.expectedCheckoutAt)}</span>
                        ) : (
                          <span>Arrives {formatDateTime(av.stay.expectedCheckInAt)}</span>
                        )}
                      </div>
                    </div>
                  ) : av.kind === "available" ? (
                    <p className="text-sm text-emerald-700 font-medium">
                      Free for this night
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {av.kind === "cleaning"
                        ? "Unavailable until housekeeping completes"
                        : "Not available for booking"}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}