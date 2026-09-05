"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room } from "@/services/rooms.service";
import { formatCurrency } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
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

export default function RoomStatusPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await RoomsService().getRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError("Could not load rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
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
            const style = statusColors[room.status];
            
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
                      <p className="font-semibold text-foreground truncate" title={room.roomTypeId}>{room.roomTypeId.slice(0, 8)}...</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Users className="h-3 w-3" /> Max</span>
                      <p className="font-medium text-foreground">{room.capacity} Guests</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5"><Wallet className="h-3 w-3" /> Base Rate</span>
                      <p className="font-medium text-foreground">{formatCurrency(room.rate)} <span className="text-muted-foreground text-xs font-normal">/ night</span></p>
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
                        {Object.keys(statusColors).map((status) => (
                          <SelectItem key={status} value={status} className="capitalize">
                            {status.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
