"use client";

import { useEffect, useState } from "react";
import GuestsService, { Guest } from "@/services/guests.service";
import { formatDate } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AlertCircle, Plus, Search, Users, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    nationality: "",
    identificationType: "",
    identificationNumber: "",
    address: "",
    emergencyContact: "",
    notes: "",
  });

  // Edit form (same fields, but separate)
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    nationality: "",
    identificationType: "",
    identificationNumber: "",
    address: "",
    emergencyContact: "",
    notes: "",
  });

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const data = await GuestsService().getGuests();
      setGuests(data);
    } catch (err) {
      console.error("Failed to fetch guests:", err);
      setError("Could not load guests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const filteredGuests = guests.filter((guest) => {
    const q = searchQuery.toLowerCase();
    return (
      guest.firstName?.toLowerCase().includes(q) ||
      guest.lastName?.toLowerCase().includes(q) ||
      guest.phone?.toLowerCase().includes(q) ||
      guest.email?.toLowerCase().includes(q)
    );
  });

  const handleCreateGuest = async () => {
    setCreating(true);
    try {
      await GuestsService().createGuest({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        phone: createForm.phone,
        email: createForm.email || undefined,
        nationality: createForm.nationality || undefined,
        identificationType: createForm.identificationType || undefined,
        identificationNumber: createForm.identificationNumber || undefined,
        address: createForm.address || undefined,
        emergencyContact: createForm.emergencyContact || undefined,
        notes: createForm.notes || undefined,
      });
      toast.success("Guest created successfully");
      setCreateDialogOpen(false);
      setCreateForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        nationality: "",
        identificationType: "",
        identificationNumber: "",
        address: "",
        emergencyContact: "",
        notes: "",
      });
      await fetchGuests();
    } catch (err) {
      console.error("Failed to create guest:", err);
      toast.error("Failed to create guest");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      phone: guest.phone,
      email: guest.email || "",
      nationality: guest.nationality || "",
      identificationType: guest.identificationType || "",
      identificationNumber: guest.identificationNumber || "",
      address: guest.address || "",
      emergencyContact: guest.emergencyContact || "",
      notes: guest.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditGuest = async () => {
    if (!selectedGuest) return;
    setEditing(true);
    try {
      await GuestsService().updateGuest(selectedGuest.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        email: editForm.email || undefined,
        nationality: editForm.nationality || undefined,
        identificationType: editForm.identificationType || undefined,
        identificationNumber: editForm.identificationNumber || undefined,
        address: editForm.address || undefined,
        emergencyContact: editForm.emergencyContact || undefined,
        notes: editForm.notes || undefined,
      });
      toast.success("Guest updated successfully");
      setEditDialogOpen(false);
      await fetchGuests();
    } catch (err) {
      console.error("Failed to update guest:", err);
      toast.error("Failed to update guest");
    } finally {
      setEditing(false);
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
          <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground">
            Search and manage guest profiles.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Guest</DialogTitle>
              <DialogDescription>
                Enter guest details for the directory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input
                    value={createForm.nationality}
                    onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Input
                    value={createForm.identificationType}
                    onChange={(e) => setCreateForm({ ...createForm, identificationType: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  value={createForm.identificationNumber}
                  onChange={(e) => setCreateForm({ ...createForm, identificationNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input
                  value={createForm.emergencyContact}
                  onChange={(e) => setCreateForm({ ...createForm, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGuest} disabled={creating}>
                {creating ? "Adding..." : "Add Guest"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search guests..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredGuests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No guests found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="h-5 w-5" />
              Guest Directory ({filteredGuests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>{guest.email || "—"}</TableCell>
                    <TableCell>{guest.nationality || "—"}</TableCell>
                    <TableCell>{formatDate(guest.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(guest)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Guest Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Guest</DialogTitle>
            <DialogDescription>
              Update guest information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input
                  value={editForm.nationality}
                  onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ID Type</Label>
                <Input
                  value={editForm.identificationType}
                  onChange={(e) => setEditForm({ ...editForm, identificationType: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ID Number</Label>
              <Input
                value={editForm.identificationNumber}
                onChange={(e) => setEditForm({ ...editForm, identificationNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <Input
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditGuest} disabled={editing}>
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
