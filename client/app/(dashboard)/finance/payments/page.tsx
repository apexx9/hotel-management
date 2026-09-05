"use client";

import { useEffect, useState } from "react";
import PaymentsService, { Payment } from "@/services/payments.service";
import InvoicesService, { Invoice } from "@/services/invoices.service";
import StaysService from "@/services/stays.service";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, Plus, Search, CreditCard } from "lucide-react";
import { toast } from "sonner";

const methodColors: Record<Payment["method"], string> = {
  cash: "bg-green-100 text-green-700 border-green-300",
  mobile_money: "bg-blue-100 text-blue-700 border-blue-300",
  card: "bg-purple-100 text-purple-700 border-purple-300",
  bank_transfer: "bg-indigo-100 text-indigo-700 border-indigo-300",
};

const statusColors: Record<Payment["status"], string> = {
  paid: "bg-green-100 text-green-700 border-green-300",
  partial: "bg-amber-100 text-amber-700 border-amber-300",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
  overdue: "bg-red-100 text-red-700 border-red-300",
  reversed: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recording, setRecording] = useState(false);

  // For new payment form
  const [stays, setStays] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    stayId: "",
    invoiceId: "",
    amount: 0,
    method: "cash",
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await PaymentsService().getPayments();
      setPayments(data);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setError("Could not load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [staysData, invoicesData] = await Promise.all([
        StaysService().getActiveStays(),
        InvoicesService().getInvoices(),
      ]);
      setStays(staysData);
      setInvoices(invoicesData);
    } catch (err) {
      console.error("Failed to fetch form data:", err);
      toast.error("Could not load stays/invoices for payment form");
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (dialogOpen) {
      fetchFormData();
    }
  }, [dialogOpen]);

  const filteredPayments = payments.filter((payment) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      payment.reference.toLowerCase().includes(q) ||
      payment.method.toLowerCase().includes(q) ||
      payment.status.toLowerCase().includes(q);
    const matchesMethod =
      methodFilter === "all" || payment.method === methodFilter;
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const handleRecordPayment = async () => {
    setRecording(true);
    try {
      await PaymentsService().recordPayment({
        stayId: form.stayId,
        invoiceId: form.invoiceId,
        amount: form.amount,
        method: form.method as Payment["method"],
        notes: form.notes || undefined,
      });
      toast.success("Payment recorded successfully");
      setDialogOpen(false);
      setForm({
        stayId: "",
        invoiceId: "",
        amount: 0,
        method: "cash",
        notes: "",
      });
      await fetchPayments();
    } catch (err) {
      console.error("Failed to record payment:", err);
      toast.error("Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
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
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Record and track all payments.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Enter payment details for a stay/invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Stay *</Label>
                <Select
                  value={form.stayId}
                  onValueChange={(value) =>
                    setForm({ ...form, stayId: value || "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stay" />
                  </SelectTrigger>
                  <SelectContent>
                    {stays.map((stay: any) => (
                      <SelectItem key={stay.id} value={stay.id}>
                        {stay.guestName || stay.reference} - Room{" "}
                        {stay.roomNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice *</Label>
                <Select
                  value={form.invoiceId}
                  onValueChange={(value) =>
                    setForm({ ...form, invoiceId: value || "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.reference} - {formatCurrency(inv.outstanding)}{" "}
                        outstanding
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Method *</Label>
                <Select
                  value={form.method}
                  onValueChange={(value) =>
                    setForm({ ...form, method: value || "cash" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={recording}>
                {recording ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search payments..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select
            value={methodFilter}
            onValueChange={(value) => setMethodFilter(value || "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value || "all")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No payments found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payments ({filteredPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={methodColors[payment.method]}
                      >
                        {payment.method.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[payment.status]}
                      >
                        {payment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
