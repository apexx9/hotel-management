"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import { formatCurrency, formatNumber } from "@/utils/utils";
import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, ArrowRight, BedDouble, DoorOpen, Users, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RoomsOverviewPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error("Failed to fetch rooms data:", err);
        setError("Could not load rooms overview. Please try again.");
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
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

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === "maintenance" || r.status === "out_of_service"
  ).length;
  const turningOverRooms = rooms.filter(
    (r) => r.status === "cleaning" || r.status === "inspection"
  ).length;

  const stats = [
    { label: "Total Rooms", value: formatNumber(totalRooms), icon: BedDouble },
    { label: "Available", value: formatNumber(availableRooms), icon: DoorOpen },
    { label: "Occupied", value: formatNumber(occupiedRooms), icon: Users },
    { label: "Maintenance", value: formatNumber(maintenanceRooms), icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rooms</h1>
        <p className="text-sm text-muted-foreground">
          Manage your hotel's room inventory and categories.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Types */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Room Types</h2>
        <Link
          href="/rooms/types"
          className="flex items-center text-sm text-primary hover:underline"
        >
          Manage types <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          {roomTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No room types found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Bed Config</TableHead>
                  <TableHead>Amenities</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{formatCurrency(type.basePrice)}</TableCell>
                    <TableCell>{type.capacity}</TableCell>
                    <TableCell>{type.bedConfiguration || "—"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {type.amenities || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick link to room grid */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="py-6 flex items-center justify-between">
          <div>
            <h3 className="font-medium">View Room Grid</h3>
            <p className="text-sm text-muted-foreground">
              See all rooms in a visual grid layout.
            </p>
          </div>
          <Link href="/rooms/grid">
            <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Open Grid
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
