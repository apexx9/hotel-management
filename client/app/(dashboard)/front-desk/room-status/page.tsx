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
import { AlertCircle, BedDouble, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<Room["status"], string> = {
  available: "bg-green-100 text-green-700 border-green-300",
  occupied: "bg-blue-100 text-blue-700 border-blue-300",
  cleaning: "bg-amber-100 text-amber-700 border-amber-300",
  inspection: "bg-purple-100 text-purple-700 border-purple-300",
  maintenance: "bg-red-100 text-red-700 border-red-300",
  out_of_service: "bg-gray-100 text-gray-700 border-gray-300",
  reserved: "bg-indigo-100 text-indigo-700 border-indigo-300",
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
      toast.success(`Room status updated to ${newStatus}`);
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Room Status</h1>
        <p className="text-sm text-muted-foreground">
          Live availability and current state of all rooms.
        </p>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rooms found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <Card key={room.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Room {room.number}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Floor {room.floor || "—"}
                    </p>
                  </div>
                  <Badge className={statusColors[room.status]} variant="outline">
                    {room.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span>Type ID: {room.roomTypeId.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Capacity: {room.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(room.rate)} / night</span>
                </div>

                <div className="pt-2">
                  <Select
                    value={room.status}
                    onValueChange={(value) =>
                      handleStatusChange(room.id, value as Room["status"])
                    }
                    disabled={updatingId === room.id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusColors).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
