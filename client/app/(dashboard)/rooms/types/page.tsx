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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, Plus, Pencil, Trash2, BedDouble, Users, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
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
          basePrice: form.basePrice,
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Room Types</h1>
          <p className="text-sm text-muted-foreground">
            Manage room categories and pricing.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room Type
        </Button>
      </div>

      {roomTypes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No room types found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Bed Config</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell>{formatCurrency(type.basePrice)}</TableCell>
                    <TableCell>{type.capacity}</TableCell>
                    <TableCell>{type.bedConfiguration || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={type.isActive ? "default" : "secondary"}>
                        {type.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id)}
                          disabled={deletingId === type.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Room Type" : "Add Room Type"}
            </DialogTitle>
            <DialogDescription>
              {editingType
                ? "Update the room type details."
                : "Enter details for the new room type."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Price *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bed Configuration</Label>
              <Input
                value={form.bedConfiguration}
                onChange={(e) => setForm({ ...form, bedConfiguration: e.target.value })}
                placeholder="e.g., 1 King, 2 Twins"
              />
            </div>
            <div className="space-y-2">
              <Label>Amenities</Label>
              <Input
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="Comma-separated list"
              />
            </div>
            {editingType && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingType ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
