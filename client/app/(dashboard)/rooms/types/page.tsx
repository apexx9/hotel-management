"use client";

import { useEffect, useState } from "react";
import RoomsService, { RoomType } from "@/services/rooms.service";
import { formatCurrency } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Pencil, Trash2, Box, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: 0,
    capacity: 1,
    bedConfiguration: "",
    amenities: "",
    isActive: true,
  });

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const data = await RoomsService().getRoomTypes();
      setRoomTypes(data);
    } catch (err) {
      console.error("Failed to fetch room types:", err);
      setError("Could not load room types. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const openCreateDialog = () => {
    setEditingType(null);
    setForm({
      name: "",
      description: "",
      basePrice: 0,
      capacity: 1,
      bedConfiguration: "",
      amenities: "",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (type: RoomType) => {
    setEditingType(type);
    setForm({
      name: type.name,
      description: type.description || "",
      basePrice: Number(type.basePrice),
      capacity: type.capacity,
      bedConfiguration: type.bedConfiguration || "",
      amenities: type.amenities || "",
      isActive: type.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingType) {
        await RoomsService().updateRoomType(editingType.id, {
          name: form.name,
          description: form.description || null,
          basePrice: String(form.basePrice),
          capacity: form.capacity,
          bedConfiguration: form.bedConfiguration || null,
          amenities: form.amenities || null,
          isActive: form.isActive,
        });
        toast.success("Room type updated successfully");
      } else {
        await RoomsService().createRoomType({
          name: form.name,
          description: form.description || undefined,
          basePrice: form.basePrice,
          capacity: form.capacity,
          bedConfiguration: form.bedConfiguration || undefined,
          amenities: form.amenities || undefined,
        });
        toast.success("Room type created successfully");
      }
      setDialogOpen(false);
      await fetchRoomTypes();
    } catch (err) {
      console.error("Failed to save room type:", err);
      toast.error("Failed to save room type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room type?")) return;
    setDeletingId(id);
    try {
      await RoomsService().deleteRoomType(id);
      toast.success("Room type deleted");
      await fetchRoomTypes();
    } catch (err) {
      console.error("Failed to delete room type:", err);
      toast.error("Failed to delete room type");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-3xl" />
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
            System Configuration
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Manage Room Types
          </h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            Define pricing, capacities, and amenities for room categories.
          </p>
          <Button onClick={openCreateDialog} className="rounded-full h-10 px-6 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* ─── DATA TABLE ────────────────────────────────────────────── */}
      {roomTypes.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[400px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No room types defined</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Create a room category to start managing your inventory.</p>
          <Button onClick={openCreateDialog} variant="outline" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Create First Category
          </Button>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Box className="h-5 w-5 text-primary" />
              Configured Categories ({roomTypes.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider pl-6">Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Base Price</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Capacity</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Bed Config</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((type) => (
                  <TableRow key={type.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-foreground pl-6">{type.name}</TableCell>
                    <TableCell className="font-medium text-primary">{formatCurrency(type.basePrice)}</TableCell>
                    <TableCell>{type.capacity} Guests</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{type.bedConfiguration || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={type.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleDelete(type.id)}
                          disabled={deletingId === type.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ─── CREATE/EDIT DIALOG ────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 border-border/50 overflow-hidden">
          <div className="bg-muted/30 p-6 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                {editingType ? "Edit Room Category" : "Add Room Category"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {editingType
                  ? "Update the details and pricing for this room type."
                  : "Define a new category of rooms for your hotel."}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 grid gap-5 bg-background">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Deluxe Ocean View"
                className="h-11 rounded-xl bg-muted/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the room..."
                className="h-11 rounded-xl bg-muted/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Price *</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                    className="h-11 pl-8 rounded-xl bg-muted/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Capacity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  className="h-11 rounded-xl bg-muted/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bed Configuration</Label>
              <Input
                value={form.bedConfiguration}
                onChange={(e) => setForm({ ...form, bedConfiguration: e.target.value })}
                placeholder="e.g., 1 King, 2 Twins"
                className="h-11 rounded-xl bg-muted/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amenities</Label>
              <Input
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="WiFi, Balcony, Mini-bar (comma separated)"
                className="h-11 rounded-xl bg-muted/20"
              />
            </div>

            {editingType && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50 mt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Category is currently active and bookable</Label>
              </div>
            )}
          </div>
          
          <div className="bg-muted/30 p-4 border-t border-border/40 flex justify-end gap-3">
            <Button variant="outline" className="rounded-full h-10 px-5" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full h-10 px-6" onClick={handleSave} disabled={saving || !form.name || form.basePrice < 0}>
              {saving ? "Saving..." : editingType ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
