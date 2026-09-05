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
import { AlertCircle, ArrowRight, BedDouble, DoorOpen, Users, Wallet, Sparkles, Box, Settings, LayoutGrid } from "lucide-react";
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
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
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

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === "maintenance" || r.status === "out_of_service"
  ).length;

  const stats = [
    { label: "Total Rooms", value: formatNumber(totalRooms), icon: BedDouble },
    { label: "Available", value: formatNumber(availableRooms), icon: DoorOpen },
    { label: "Occupied", value: formatNumber(occupiedRooms), icon: Users },
    { label: "Maintenance", value: formatNumber(maintenanceRooms), icon: Sparkles },
  ];

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Inventory Overview
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Rooms & Types
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Manage your hotel's room inventory, capacities, and category configurations.
        </p>
      </div>

      {/* ─── STATS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg h-full group">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <stat.icon className="h-4 w-4" />
                <span>{stat.label}</span>
              </div>
              
              <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1 transition-transform group-hover:-translate-y-1">
                <p className="text-4xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">Current Count</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── ROOM TYPES ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Room Types</h2>
          </div>
          <Link
            href="/rooms/types"
            className="flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <Settings className="mr-1.5 h-4 w-4" /> Manage types
          </Link>
        </div>

        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {roomTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <Box className="h-6 w-6" />
                </div>
                <p className="text-lg font-medium text-foreground">No room types defined</p>
                <p className="text-sm text-muted-foreground mt-1">Create categories like "Standard" or "Suite" to group your inventory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Base Price</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Capacity</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Bed Config</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Amenities</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((type) => (
                      <TableRow key={type.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-foreground">{type.name}</TableCell>
                        <TableCell className="font-medium text-primary">{formatCurrency(type.basePrice)}</TableCell>
                        <TableCell className="text-sm"><Users className="inline-block h-3.5 w-3.5 mr-1 text-muted-foreground" /> {type.capacity}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{type.bedConfiguration || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {type.amenities || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={type.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                            {type.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── QUICK LINK TO ROOM GRID ────────────────────────────────────────────── */}
      <Link href="/rooms/grid" className="block group">
        <Card className="rounded-3xl border border-primary/20 bg-primary/5 shadow-sm transition-all hover:bg-primary/10 hover:border-primary/30">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <LayoutGrid className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Visual Room Grid</h3>
                <p className="text-sm text-primary/80 mt-0.5">
                  See all rooms, their status, and availability in a birds-eye floorplan view.
                </p>
              </div>
            </div>
            <span className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md transition-transform group-hover:scale-105 shrink-0">
              Open Grid <ArrowRight className="ml-2 h-4 w-4" />
            </span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
