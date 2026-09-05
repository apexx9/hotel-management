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
import { AlertCircle, Plus, Search, Users, Pencil, Contact, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full max-w-sm rounded-full" />
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
            Guest Relations
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Guest Directory
          </h1>
        </div>
        <div className="flex flex-col items-end gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
            Manage profiles, contact information, and history for all your guests.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="rounded-full h-10 px-6 shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* ─── ACTION BAR ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, email, or phone..."
            className="pl-10 h-12 rounded-full bg-muted/40 border-border/50 focus-visible:ring-primary/20 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ─── GUEST TABLE ────────────────────────────────────────────── */}
      {filteredGuests.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[400px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No guests found</p>
          <p className="text-sm text-muted-foreground mt-1 mb-6">Try a different search or add a new guest profile.</p>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Profiles ({filteredGuests.length})
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs uppercase tracking-wider pl-6">Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Nationality</TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider">Added</TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="font-bold text-foreground pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {guest.firstName.charAt(0)}{guest.lastName.charAt(0)}
                        </div>
                        {guest.firstName} {guest.lastName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{guest.phone}</span>
                        {guest.email && <span className="text-xs text-muted-foreground">{guest.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{guest.nationality || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(guest.createdAt)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        onClick={() => openEditDialog(guest)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ─── CREATE GUEST DIALOG ────────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] rounded-3xl p-0 border-border/50 overflow-hidden flex flex-col">
          <div className="bg-muted/30 p-6 border-b border-border/40 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Create Guest Profile</DialogTitle>
              <DialogDescription className="mt-1">
                Enter the details to add a new guest to the directory.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 overflow-y-auto bg-background flex-1">
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</Label>
                  <Input
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</Label>
                  <Input
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone *</Label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nationality</Label>
                  <Input
                    value={createForm.nationality}
                    onChange={(e) => setCreateForm({ ...createForm, nationality: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Type</Label>
                  <Input
                    value={createForm.identificationType}
                    onChange={(e) => setCreateForm({ ...createForm, identificationType: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    placeholder="e.g., Passport, Driver's License"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Number</Label>
                <Input
                  value={createForm.identificationNumber}
                  onChange={(e) => setCreateForm({ ...createForm, identificationNumber: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</Label>
                <Input
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact</Label>
                <Input
                  value={createForm.emergencyContact}
                  onChange={(e) => setCreateForm({ ...createForm, emergencyContact: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
                <Input
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
            </div>
          </div>
          <div className="bg-muted/30 p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} className="rounded-full h-10 px-5">
              Cancel
            </Button>
            <Button onClick={handleCreateGuest} disabled={creating || !createForm.firstName || !createForm.lastName || !createForm.phone} className="rounded-full h-10 px-6">
              {creating ? "Adding..." : "Add Guest"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT GUEST DIALOG ────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] rounded-3xl p-0 border-border/50 overflow-hidden flex flex-col">
          <div className="bg-muted/30 p-6 border-b border-border/40 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Edit Guest Profile</DialogTitle>
              <DialogDescription className="mt-1">
                Update the information for this guest.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 overflow-y-auto bg-background flex-1">
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name *</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name *</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone *</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nationality</Label>
                  <Input
                    value={editForm.nationality}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Type</Label>
                  <Input
                    value={editForm.identificationType}
                    onChange={(e) => setEditForm({ ...editForm, identificationType: e.target.value })}
                    className="h-11 rounded-xl bg-muted/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Number</Label>
                <Input
                  value={editForm.identificationNumber}
                  onChange={(e) => setEditForm({ ...editForm, identificationNumber: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</Label>
                <Input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Contact</Label>
                <Input
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="h-11 rounded-xl bg-muted/20"
                />
              </div>
            </div>
          </div>
          <div className="bg-muted/30 p-4 border-t border-border/40 flex justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-full h-10 px-5">
              Cancel
            </Button>
            <Button onClick={handleEditGuest} disabled={editing || !editForm.firstName || !editForm.lastName || !editForm.phone} className="rounded-full h-10 px-6">
              {editing ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
