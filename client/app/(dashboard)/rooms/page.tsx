"use client";

import { useEffect, useState } from "react";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import { formatCurrency, formatNumber } from "@/utils/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  DoorOpen,
  Users,
  Wallet,
  Sparkles,
  Box,
  Settings,
  LayoutGrid,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function expandRange(start: string, end: string): string[] {
  const s = start.trim();
  const e = end.trim();
  const numMatch = (str: string) => str.match(/^(\D*)(\d+)(\D*)$/);
  const ms = numMatch(s);
  const me = numMatch(e);
  if (!ms || !me || ms[1] !== me[1] || ms[3] !== me[3]) {
    return [s];
  }
  const width = Math.max(ms[2].length, me[2].length);
  const a = parseInt(ms[2], 10);
  const b = parseInt(me[2], 10);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const out: string[] = [];
  for (let i = lo; i <= hi; i++) {
    out.push(ms[1] + String(i).padStart(width, "0") + ms[3]);
    if (out.length >= 100) break;
  }
  return out;
}

export default function RoomsOverviewPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [newRoomForm, setNewRoomForm] = useState({
    number: "",
    floor: "1",
    roomTypeId: "",
    rate: 0,
    capacity: 2,
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStart, setBulkStart] = useState("");
  const [bulkEnd, setBulkEnd] = useState("");

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoomForm.number.trim() || !newRoomForm.roomTypeId) {
      toast.error("Room number and room type are required.");
      return;
    }

    setSavingRoom(true);
    try {
      await RoomsService().createRoom({
        number: newRoomForm.number.trim(),
        floor: newRoomForm.floor,
        roomTypeId: newRoomForm.roomTypeId,
        rate: Number(newRoomForm.rate || 0),
        capacity: Number(newRoomForm.capacity || 2),
      });
      toast.success("Room created successfully");
      setRoomDialogOpen(false);
      setNewRoomForm({
        number: "",
        floor: "1",
        roomTypeId: roomTypes[0]?.id ?? "",
        rate: Number(roomTypes[0]?.basePrice ?? 0),
        capacity: roomTypes[0]?.capacity ?? 2,
      });
      await fetchData();
    } catch (err) {
      console.error("Failed to create room:", err);
      toast.error("Failed to create room.");
    } finally {
      setSavingRoom(false);
    }
  };

  const handleCreateRoomsBulk = async () => {
    if (!newRoomForm.floor || !newRoomForm.roomTypeId) {
      toast.error("Floor and room type are required.");
      return;
    }
    if (!bulkStart.trim() || !bulkEnd.trim()) {
      toast.error("Enter a start and end room number.");
      return;
    }

    const numbers = expandRange(bulkStart, bulkEnd);
    const existingNumbers = new Set(rooms.map((r) => r.number));
    const fresh = numbers.filter((n) => !existingNumbers.has(n));
    const skipped = numbers.length - fresh.length;

    if (fresh.length === 0) {
      toast.info("All of those room numbers already exist.");
      return;
    }

    setSavingRoom(true);
    try {
      const payload = fresh.map((number) => ({
        number,
        floor: newRoomForm.floor,
        roomTypeId: newRoomForm.roomTypeId,
        rate: Number(newRoomForm.rate || 0),
        capacity: Number(newRoomForm.capacity || 2),
      }));
      const result = await RoomsService().createRoomsBulk(payload);
      const conflictCount = skipped + (result.conflicts?.length ?? 0);
      toast.success(
        conflictCount > 0
          ? `Created ${result.created.length} rooms. ${conflictCount} existing number(s) skipped.`
          : `Created ${result.created.length} rooms successfully.`,
      );
      setRoomDialogOpen(false);
      setBulkStart("");
      setBulkEnd("");
      await fetchData();
    } catch (err) {
      console.error("Failed to bulk create rooms:", err);
      toast.error("Failed to create rooms.");
    } finally {
      setSavingRoom(false);
    }
  };

  if (loading) {
    return <PageLoading showHeader showStats={4} showTable />;
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

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === "maintenance" || r.status === "out_of_service",
  ).length;

  const stats = [
    { label: "Total Rooms", value: formatNumber(totalRooms), icon: BedDouble },
    { label: "Available", value: formatNumber(availableRooms), icon: DoorOpen },
    { label: "Occupied", value: formatNumber(occupiedRooms), icon: Users },
    {
      label: "Maintenance",
      value: formatNumber(maintenanceRooms),
      icon: Sparkles,
    },
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
        <div className="flex flex-col items-end gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            Manage your hotel's room inventory, capacities, and category
            configurations.
          </p>
          <Button
            onClick={() => setRoomDialogOpen(true)}
            className="rounded-full h-10 px-6 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* ─── STATS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg h-full group"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <stat.icon className="h-4 w-4" />
                <span>{stat.label}</span>
              </div>

              <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-1 transition-transform group-hover:-translate-y-1">
                <p className="text-4xl font-extrabold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">Current Count</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
            <DialogDescription>
              Add a room to make it available for new bookings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 p-1">
              {[
                { key: false, label: "Single room" },
                { key: true, label: "Many rooms" },
              ].map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  onClick={() => setBulkMode(mode.key)}
                  className={cn(
                    "flex-1 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    bulkMode === mode.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {!bulkMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input
                    value={newRoomForm.number}
                    onChange={(e) =>
                      setNewRoomForm({ ...newRoomForm, number: e.target.value })
                    }
                    placeholder="101"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Floor</Label>
                  <Input
                    value={newRoomForm.floor}
                    onChange={(e) =>
                      setNewRoomForm({ ...newRoomForm, floor: e.target.value })
                    }
                    placeholder="1"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input
                      value={bulkStart}
                      onChange={(e) => setBulkStart(e.target.value)}
                      placeholder="101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                      value={bulkEnd}
                      onChange={(e) => setBulkEnd(e.target.value)}
                      placeholder="110"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Floor</Label>
                    <Input
                      value={newRoomForm.floor}
                      onChange={(e) =>
                        setNewRoomForm({
                          ...newRoomForm,
                          floor: e.target.value,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>
                {bulkStart.trim() && bulkEnd.trim() && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Will create{" "}
                      {expandRange(bulkStart, bulkEnd).length} room(s):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {expandRange(bulkStart, bulkEnd).map((n) => {
                        const exists = rooms.some((r) => r.number === n);
                        return (
                          <span
                            key={n}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium border",
                              exists
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20 line-through"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                            )}
                          >
                            {n}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Room Type</Label>
              <select
                value={newRoomForm.roomTypeId}
                onChange={(e) => {
                  const selectedType = roomTypes.find(
                    (type) => type.id === e.target.value,
                  );
                  setNewRoomForm({
                    ...newRoomForm,
                    roomTypeId: e.target.value,
                    rate: Number(selectedType?.basePrice ?? 0),
                    capacity: selectedType?.capacity ?? 2,
                  });
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select room type</option>
                {roomTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {roomTypes.length === 0 ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <span>No room types yet — rooms need at least one.</span>
                  <Link
                    href="/rooms/types"
                    className="shrink-0 font-semibold text-amber-800 underline-offset-2 hover:underline"
                  >
                    Create a type →
                  </Link>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Link
                    href="/rooms/types"
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Manage room types →
                  </Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nightly Rate</Label>
                <Input
                  type="number"
                  min={0}
                  value={newRoomForm.rate}
                  onChange={(e) =>
                    setNewRoomForm({
                      ...newRoomForm,
                      rate: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min={1}
                  value={newRoomForm.capacity}
                  onChange={(e) =>
                    setNewRoomForm({
                      ...newRoomForm,
                      capacity: Number(e.target.value || 1),
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={bulkMode ? handleCreateRoomsBulk : handleCreateRoom}
              disabled={savingRoom}
            >
              {savingRoom
                ? bulkMode
                  ? "Creating rooms..."
                  : "Creating..."
                : bulkMode
                  ? "Create Rooms"
                  : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <p className="text-lg font-medium text-foreground">
                  No room types defined
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create categories like "Standard" or "Suite" to group your
                  inventory.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Base Price
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Capacity
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Bed Config
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Amenities
                      </TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomTypes.map((type) => (
                      <TableRow
                        key={type.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell className="font-semibold text-foreground">
                          {type.name}
                        </TableCell>
                        <TableCell className="font-medium text-primary">
                          {formatCurrency(type.basePrice)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Users className="inline-block h-3.5 w-3.5 mr-1 text-muted-foreground" />{" "}
                          {type.capacity}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {type.bedConfiguration || "—"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {type.amenities || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              type.isActive
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-muted text-muted-foreground"
                            }
                          >
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
                <h3 className="text-lg font-bold text-primary">
                  Visual Room Grid
                </h3>
                <p className="text-sm text-primary/80 mt-0.5">
                  See all rooms, their status, and availability in a birds-eye
                  floorplan view.
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
