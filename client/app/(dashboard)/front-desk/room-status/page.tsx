"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room } from "@/services/rooms.service";
import { formatCurrency } from "@/utils/utils";
import { useCurrency } from "@/utils/currency";
import { roomStatusColors } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, BedDouble, Check, Users, Wallet, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

const MANUAL_STATUSES = Object.keys(roomStatusColors).filter(
  (s) => s !== "occupied" && s !== "reserved",
);


export default function RoomStatusPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const currency = useCurrency();

  const fetchRooms = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [data, types] = await Promise.all([
        RoomsService().getRooms(),
        RoomsService().getRoomTypes(),
      ]);
      setRooms(data);
      setRoomTypes(Object.fromEntries(types.map((t) => [t.id, t.name])));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      if (!silent) setError("Could not load rooms. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchRooms();
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  useRealtimeRefresh(() => fetchRooms(true));

  const handleStatusChange = async (roomId: string, newStatus: Room["status"]) => {
    setUpdatingId(roomId);
    try {
      await RoomsService().updateRoomStatus(roomId, newStatus);
      toast.success(`Room status updated to ${newStatus.replace("_", " ")}`);
      await fetchRooms(); // refresh
    } catch (err) {
      console.error("Failed to update room status:", err);
      toast.error("Failed to update room status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAvailable = async (roomId: string) => {
    setUpdatingId(roomId);
    try {
      await RoomsService().markAvailable(roomId);
      toast.success("Room marked available");
      await fetchRooms(); // refresh
    } catch (err) {
      console.error("Failed to mark room available:", err);
      toast.error("Failed to mark room available");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <PageLoading showHeader showGrid />;
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
            Room Status
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Live availability, maintenance state, and quick status updates for all rooms.
        </p>
      </div>

      {/* ─── GRID ────────────────────────────────────────────── */}
      {rooms.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No rooms configured</p>
          <p className="text-sm text-muted-foreground mt-1">Please add rooms in the settings to monitor their status.</p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => {
            const style = roomStatusColors[room.status];
            
            return (
              <Card key={room.id} className="relative rounded-3xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all flex flex-col">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        Room {room.number}
                      </CardTitle>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">
                        Floor {room.floor || "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("capitalize px-2.5 py-0.5 border font-semibold", style.bg, style.text, style.border)}>
                      {room.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><BedDouble className="h-3 w-3" /> Type</span>
                      <p className="font-semibold text-foreground truncate" title={roomTypes[room.roomTypeId]}>{roomTypes[room.roomTypeId] || "Room type"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3 w-3" /> Max</span>
                      <p className="font-medium text-foreground">{room.capacity} Guests</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Base Rate</span>
                      <p className="font-medium text-foreground">{formatCurrency(room.rate, currency)} <span className="text-muted-foreground text-xs font-normal">/ night</span></p>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <Select
                      value={room.status}
                      onValueChange={(value) =>
                        handleStatusChange(room.id, value as Room["status"])
                      }
                      disabled={updatingId === room.id}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl bg-muted/20 border-border/60">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {MANUAL_STATUSES.map((status) => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {room.status !== "available" && room.status !== "occupied" && room.status !== "reserved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                      onClick={() => handleMarkAvailable(room.id)}
                      disabled={updatingId === room.id}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Mark available
                    </Button>
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
