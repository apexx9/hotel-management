"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import { formatCurrency } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, BedDouble, Users, Wallet, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<Room["status"], { bg: string, text: string, border: string }> = {
  available: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  occupied: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20" },
  cleaning: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20" },
  inspection: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  maintenance: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/20" },
  out_of_service: { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" },
  reserved: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
};

export default function RoomGridPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, typesData] = await Promise.all([
          RoomsService().getRooms(),
          RoomsService().getRoomTypes(),
        ]);
        setRooms(roomsData);
        setRoomTypes(typesData);
      } catch (err) {
        console.error("Failed to fetch room grid data:", err);
        setError("Could not load room grid. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-12 w-40 rounded-full" />
          <Skeleton className="h-12 w-48 rounded-full" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-3xl" />
          ))}
        </div>
      </div>
    );
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

  const floors = Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(rooms.map((r) => r.status)));

  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = floorFilter === "all" || room.floor === floorFilter;
    const matchesType = typeFilter === "all" || room.roomTypeId === typeFilter;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesFloor && matchesType && matchesStatus;
  });

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
          Birds-eye view of your entire property, color-coded by real-time status.
        </p>
      </div>

      {/* ─── FILTERS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-4 rounded-3xl border border-border/40">
        <div className="w-full sm:w-40">
          <Select value={floorFilter} onValueChange={(value) => setFloorFilter(value || "all")}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60 shadow-sm">
              <SelectValue placeholder="All floors" />
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
        <div className="w-full sm:w-48">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value || "all")}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60 shadow-sm">
              <SelectValue placeholder="All types" />
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
        <div className="w-full sm:w-40">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="h-11 rounded-xl bg-background border-border/60 shadow-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── ROOM CARDS ────────────────────────────────────────────── */}
      {filteredRooms.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No rooms found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to see more results.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => {
            const style = statusColors[room.status] || { bg: "bg-muted", text: "text-muted-foreground", border: "border-border" };
            
            return (
              <Card
                key={room.id}
                className={cn("relative rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col", style.border, style.bg)}
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
                    <Badge variant="secondary" className={cn("capitalize px-2.5 py-0.5 border font-semibold bg-background/50", style.text, style.border)}>
                      {room.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm opacity-90">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><BedDouble className="h-3 w-3" /> Type</span>
                      <p className="font-semibold truncate" title={roomTypes.find((t) => t.id === room.roomTypeId)?.name || "Unknown type"}>
                        {roomTypes.find((t) => t.id === room.roomTypeId)?.name || "Unknown"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3 w-3" /> Max</span>
                      <p className="font-semibold">{room.capacity} Guests</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Rate</span>
                      <p className="font-semibold">{formatCurrency(room.rate)} <span className="opacity-70 text-xs font-normal">/ night</span></p>
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
