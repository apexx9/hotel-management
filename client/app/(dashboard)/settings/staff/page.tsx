"use client";

import { useEffect, useState } from "react";
import StaffService from "@/services/staff.service";
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Invite and manage staff members.
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite Staff Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to join your hotel team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Input
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  placeholder="e.g., Front Desk Manager"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviting}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members ({staff.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No staff members found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.fullName || member.name || member.email}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.role || "—"}</TableCell>
                    <TableCell>
                      {member.isVerified ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(member)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitations list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations ({invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No pending invitations.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{inv.role || "—"}</TableCell>
                    <TableCell>{formatDate(inv.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit staff dialog */}
      <Dialog open={!!editingStaffId} onOpenChange={(open) => !open && setEditingStaffId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update role and verification status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVerified"
                checked={editForm.isVerified}
                onChange={(e) =>
                  setEditForm({ ...editForm, isVerified: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isVerified">Verified</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStaffId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={savingStaff}>
              {savingStaff ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
