"use client";

import { useEffect, useState } from "react";
import StaffService from "@/services/staff.service";
import { formatDate } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Plus,
  Users,
  Mail,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);

  // Invite form
  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "",
    fullName: "",
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    role: "",
    isVerified: false,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await StaffService().getStaff();
      setStaff(data.staff || []);
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      setError("Could not load staff data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInvite = async () => {
    setInviting(true);
    try {
      await StaffService().inviteStaff({
        email: inviteForm.email,
        role: inviteForm.role,
        fullName: inviteForm.fullName || undefined,
      });
      toast.success("Invitation sent successfully");
      setInviteDialogOpen(false);
      setInviteForm({ email: "", role: "", fullName: "" });
      await fetchData();
    } catch (err) {
      console.error("Failed to invite staff:", err);
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const openEditDialog = (staffMember: any) => {
    setEditingStaffId(staffMember.id);
    setEditForm({
      role: staffMember.role || "",
      isVerified: staffMember.isVerified || false,
    });
  };

  const handleUpdateStaff = async () => {
    if (!editingStaffId) return;
    setSavingStaff(true);
    try {
      await StaffService().updateStaff(editingStaffId, {
        role: editForm.role,
        isVerified: editForm.isVerified,
      });
      toast.success("Staff updated");
      setEditingStaffId(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to update staff:", err);
      toast.error("Failed to update staff");
    } finally {
      setSavingStaff(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
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

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Team Management
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Staff
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right hidden md:block">
            Invite and manage your hotel team members.
          </p>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            {/* FIXED: Removed nested Button, styles applied directly to DialogTrigger */}
            <DialogTrigger className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg">
              <Plus className="h-4 w-4" />
              Invite Staff
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  Invite Staff Member
                </DialogTitle>
                <DialogDescription>
                  Send an invitation email to join your hotel team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Full Name
                  </Label>
                  <Input
                    className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                    value={inviteForm.fullName}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, fullName: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email *
                  </Label>
                  <Input
                    type="email"
                    className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm({ ...inviteForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role *
                  </Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) =>
                      setInviteForm({ ...inviteForm, role: value || "" })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="front_desk">Front Desk</SelectItem>
                      <SelectItem value="housekeeping">Housekeeping</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="rounded-full"
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ─── STAFF LIST ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Staff Members ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                <Info className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No staff members
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Invite your first team member to get started.
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
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow
                      key={member.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {(member.fullName || member.name || member.email)
                              ?.charAt(0)
                              ?.toUpperCase() || "S"}
                          </div>
                          <span className="font-semibold text-foreground text-sm">
                            {member.fullName || member.name || member.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-[10px] bg-muted/60 px-1.5 py-0"
                        >
                          {member.role || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.isVerified ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10 gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-500/30 bg-amber-500/10 gap-1"
                          >
                            <XCircle className="h-3 w-3" /> Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          className="rounded-lg text-xs font-medium hover:bg-muted/40"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── PENDING INVITATIONS ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Pending Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                <Info className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No pending invitations
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                All invitations have been accepted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider">
                      Sent
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="font-semibold text-foreground text-sm">
                        {inv.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-md font-mono text-[10px] bg-muted/60 px-1.5 py-0"
                        >
                          {inv.role || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── EDIT STAFF DIALOG ────────────────────────────────────────────── */}
      <Dialog
        open={!!editingStaffId}
        onOpenChange={(open) => !open && setEditingStaffId(null)}
      >
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Edit Staff Member
            </DialogTitle>
            <DialogDescription>
              Update role and verification status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({ ...editForm, role: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-border/40 p-4">
              <input
                type="checkbox"
                id="isVerified"
                checked={editForm.isVerified}
                onChange={(e) =>
                  setEditForm({ ...editForm, isVerified: e.target.checked })
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label
                htmlFor="isVerified"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Verified
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStaffId(null)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStaff}
              disabled={savingStaff}
              className="rounded-full"
            >
              {savingStaff ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
