"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import { formatCurrency } from "@/utils/utils";
import { roomStatusColors } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, BedDouble, Users, Wallet, Info, FilterX, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

export default function RoomGridPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [roomsData, typesData] = await Promise.all([
        RoomsService().getRooms(),
        RoomsService().getRoomTypes(),
      ]);
      setRooms(roomsData);
      setRoomTypes(typesData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch room grid data:", err);
      if (!silent) setError("Could not load room grid. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeRefresh(() => fetchData(true));

  if (loading) {
    return <PageLoading showHeader showPills showGrid />;
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

  const floors = Array.from(
    new Set(rooms.map((r) => r.floor).filter(Boolean)),
  ) as string[];
  const statuses = Array.from(new Set(rooms.map((r) => r.status)));
  const roomTypeMap = new Map(roomTypes.map((type) => [type.id, type.name]));

  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = floorFilter === "all" || room.floor === floorFilter;
    const matchesType = typeFilter === "all" || room.roomTypeId === typeFilter;
    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;
    return matchesFloor && matchesType && matchesStatus;
  });

  const hasFilters =
    floorFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  const clearAll = () => {
    setFloorFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const floorLabel = (value: string | null) =>
    !value || value === "all" ? "All floors" : `Floor ${value}`;

  const typeLabel = (value: string | null) =>
    !value || value === "all"
      ? "All types"
      : roomTypeMap.get(value) || "All types";

  const statusLabel = (value: string | null) =>
    !value || value === "all"
      ? "All statuses"
      : value.replace(/_/g, " ");

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Inventory Management
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Visual Room Grid
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Birds-eye view of your entire property, color-coded by real-time
          status.
        </p>
      </div>

      {/* ─── FILTERS ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
            {/* ── Floor ── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Layers className="h-3.5 w-3.5" /> Floor
              </label>
              <Select
                value={floorFilter}
                onValueChange={(value) => setFloorFilter(value || "all")}
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full rounded-xl border-border/60 bg-background shadow-sm",
                    floorFilter !== "all" &&
                      "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <SelectValue>{(value) => floorLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All floors</SelectItem>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Type ── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" /> Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value || "all")}
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full rounded-xl border-border/60 bg-background shadow-sm",
                    typeFilter !== "all" &&
                      "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <SelectValue>{(value) => typeLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All types</SelectItem>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Status ── */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value || "all")}
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full rounded-xl border-border/60 bg-background shadow-sm",
                    statusFilter !== "all" &&
                      "border-primary ring-2 ring-primary/20",
                  )}
                >
                  <SelectValue>{(value) => statusLabel(value)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Count & clear ── */}
          <div className="flex shrink-0 items-center justify-between gap-2 lg:flex-col lg:items-end">
            <p className="text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">
                {filteredRooms.length}
              </span>{" "}
              of {rooms.length} rooms
            </p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <FilterX className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── ROOM CARDS ────────────────────────────────────────────── */}
      {filteredRooms.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md text-center">
            Create your hotel setup first: add room types, then add rooms on the
            right floor so they appear in this visual grid.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => {
            const style = roomStatusColors[room.status] || {
              bg: "bg-muted",
              text: "text-muted-foreground",
              border: "border-border",
            };

            return (
              <Card
                key={room.id}
                className={cn(
                  "relative rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col",
                  style.border,
                  style.bg,
                )}
              >
                <CardHeader className="pb-3 border-b border-background/40">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        Room {room.number}
                      </CardTitle>
                      <p className="text-xs font-medium opacity-80 mt-0.5">
                        Floor {room.floor || "—"}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize px-2.5 py-0.5 border font-semibold bg-background/50",
                        style.text,
                        style.border,
                      )}
                    >
                      {room.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm opacity-90">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <BedDouble className="h-3 w-3" /> Type
                      </span>
                      <p
                        className="font-semibold truncate"
                        title={
                          roomTypeMap.get(room.roomTypeId) || "Unknown type"
                        }
                      >
                        {roomTypeMap.get(room.roomTypeId) || "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Max
                      </span>
                      <p className="font-semibold">{room.capacity} Guests</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="h-3 w-3" /> Rate
                      </span>
                      <p className="font-semibold">
                        {formatCurrency(room.rate)}{" "}
                        <span className="opacity-70 text-xs font-normal">
                          / night
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
