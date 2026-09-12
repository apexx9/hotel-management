"use client";

import { useEffect, useState } from "react";
import StaffService from "@/services/staff.service";
import AuthService from "@/services/auth.service";
import { formatDate } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  createdAt?: string;
}

interface StaffMember {
  id: string;
  fullName?: string | null;
  name?: string | null;
  email?: string | null;
  role: string;
  isVerified: boolean;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);
  const [revokingInvite, setRevokingInvite] = useState<PendingInvitation | null>(
    null,
  );
  const [revoking, setRevoking] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(
    null,
  );
  const [removingStaff, setRemovingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
  } | null>(null);

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
    let active = true;
    const init = async () => {
      if (!active) return;
      fetchData();
      AuthService()
        .getCurrentUser()
        .then((user) => {
          if (active)
            setCurrentUser(user ? { id: user.id, role: user.role } : null);
        })
        .catch(() => {
          if (active) setCurrentUser(null);
        });
    };
    init();
    return () => {
      active = false;
    };
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

  const openEditDialog = (staffMember: StaffMember) => {
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

  const handleResendInvitation = async (invitation: PendingInvitation) => {
    setResendingInviteId(invitation.id);
    try {
      await StaffService().resendInvitation(invitation.id);
      toast.success("Invitation resent — the old link was replaced");
      await fetchData();
    } catch (err) {
      console.error("Failed to resend invitation:", err);
      toast.error("Failed to resend invitation");
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleRevokeInvitation = async () => {
    if (!revokingInvite) return;
    setRevoking(true);
    try {
      await StaffService().revokeInvitation(revokingInvite.id);
      toast.success("Invitation removed — the invite link no longer works");
      setRevokingInvite(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to revoke invitation:", err);
      toast.error("Failed to remove invitation");
    } finally {
      setRevoking(false);
    }
  };

  const handleRemoveStaff = async () => {
    if (!removingStaff) return;
    setDeletingStaff(true);
    try {
      await StaffService().deleteStaff(removingStaff.id);
      toast.success(`${removingStaff.fullName} was removed from the hotel`);
      setRemovingStaff(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to remove staff:", err);
      toast.error("Failed to remove staff member");
    } finally {
      setDeletingStaff(false);
    }
  };

  if (loading) {
    return <PageLoading showHeader showCards={2} />;
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
            <DialogContent className="sm:max-w-[500px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
              <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                    Invite Staff Member
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-slate-500">
                    Send an invitation email to join your hotel team.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <div className="space-y-6 p-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Full Name
                    </Label>
                    <Input
                      className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      value={inviteForm.fullName}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, fullName: e.target.value })
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Email *
                    </Label>
                    <Input
                      type="email"
                      className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                      value={inviteForm.email}
                      onChange={(e) =>
                        setInviteForm({ ...inviteForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Role *
                    </Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) =>
                        setInviteForm({ ...inviteForm, role: value || "" })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
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
              </div>
              <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                            className="rounded-lg text-xs font-medium hover:bg-muted/40"
                          >
                            Edit
                          </Button>
                          {member.role !== "owner" &&
                          member.id !== currentUser?.id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRemovingStaff(member)}
                              className="rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Remove
                            </Button>
                          ) : null}
                        </div>
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
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-right">
                      Actions
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(inv)}
                            disabled={resendingInviteId === inv.id}
                            className="rounded-lg text-xs font-medium hover:bg-muted/40"
                          >
                            <RefreshCw
                              className={
                                resendingInviteId === inv.id
                                  ? "h-3.5 w-3.5 mr-1 animate-spin"
                                  : "h-3.5 w-3.5 mr-1"
                              }
                            />
                            {resendingInviteId === inv.id
                              ? "Sending..."
                              : "Resend"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRevokingInvite(inv)}
                            className="rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remove
                          </Button>
                        </div>
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
        <DialogContent className="sm:max-w-[400px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Edit Staff Member
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                Update role and verification status.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Role
                </Label>
                <Select
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value || "" })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200 shadow-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
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
              <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={editForm.isVerified}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isVerified: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <Label
                  htmlFor="isVerified"
                  className="text-sm font-medium text-slate-700 cursor-pointer"
                >
                  Verified
                </Label>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button
              variant="outline"
              onClick={() => setEditingStaffId(null)}
              className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStaff}
              disabled={savingStaff}
              className="h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {savingStaff ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── REVOKE INVITATION DIALOG ───────────────────────────────────── */}
      <Dialog
        open={!!revokingInvite}
        onOpenChange={(open) => !open && setRevokingInvite(null)}
      >
        <DialogContent className="sm:max-w-[420px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                Remove invitation
              </DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                Withdraw the pending invitation to{" "}
                <span className="font-semibold text-slate-900">
                  {revokingInvite?.email}
                </span>
                ?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600 leading-relaxed">
                The invite link they received will stop working immediately. If
                they haven&apos;t created their account yet, they won&apos;t be
                able to sign up. Anyone who already joined shows up in the Staff
                list instead and is unaffected.
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button
              variant="outline"
              onClick={() => setRevokingInvite(null)}
              className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeInvitation}
              disabled={revoking}
              className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {revoking ? "Removing..." : "Remove Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── REMOVE STAFF DIALOG ───────────────────────────────────── */}
      <Dialog
        open={!!removingStaff}
        onOpenChange={(open) => !open && setRemovingStaff(null)}
      >
        <DialogContent className="sm:max-w-[420px] max-h-[88vh] flex flex-col overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl bg-white">
          <div className="shrink-0 bg-slate-50/80 px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Remove staff</DialogTitle>
              <DialogDescription className="mt-1 text-slate-500">
                Remove{" "}
                <span className="font-semibold text-slate-900">
                  {removingStaff?.fullName} ({removingStaff?.email})
                </span>
                from the hotel?
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-6 p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600 leading-relaxed">
                They will immediately lose access to the hotel workspace and any
                pending invitation for their email will stop working. Bookings,
                invoices, and history stay intact — only the account is removed.
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-3 rounded-b-2xl border-t border-slate-100 bg-white p-5">
            <Button
              variant="outline"
              onClick={() => setRemovingStaff(null)}
              className="h-10 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveStaff}
              disabled={deletingStaff}
              className="h-10 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {deletingStaff ? "Removing..." : "Remove Member"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
