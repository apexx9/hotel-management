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
import { AlertCircle, BedDouble, Users, Wallet, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<Room["status"], string> = {
  available: "bg-green-50 border-green-300 text-green-700",
  occupied: "bg-blue-50 border-blue-300 text-blue-700",
  cleaning: "bg-amber-50 border-amber-300 text-amber-700",
  inspection: "bg-purple-50 border-purple-300 text-purple-700",
  maintenance: "bg-red-50 border-red-300 text-red-700",
  out_of_service: "bg-gray-50 border-gray-300 text-gray-700",
  reserved: "bg-indigo-50 border-indigo-300 text-indigo-700",
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
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

  const floors = Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(rooms.map((r) => r.status)));

  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = floorFilter === "all" || room.floor === floorFilter;
    const matchesType = typeFilter === "all" || room.roomTypeId === typeFilter;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesFloor && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Room Grid</h1>
        <p className="text-sm text-muted-foreground">
          Visual overview of all rooms and their current status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="w-40">
          <Select value={floorFilter} onValueChange={setFloorFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All floors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All floors</SelectItem>
              {floors.map((floor) => (
                <SelectItem key={floor} value={floor}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {roomTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Room cards */}
      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rooms match the current filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRooms.map((room) => (
            <Card
              key={room.id}
              className={cn("border-2 transition-colors", statusColors[room.status])}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      Room {room.number}
                    </CardTitle>
                    <p className="text-xs opacity-70">
                      Floor {room.floor || "—"}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {room.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 opacity-70" />
                  <span>
                    {roomTypes.find((t) => t.id === room.roomTypeId)?.name || "Unknown type"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 opacity-70" />
                  <span>Capacity: {room.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 opacity-70" />
                  <span>{formatCurrency(room.rate)} / night</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
