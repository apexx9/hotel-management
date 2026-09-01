"use client";

import { useEffect, useState } from "react";
import InvoicesService, { Invoice } from "@/services/invoices.service";
import { formatCurrency, formatDateTime } from "@/utils/utils";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Search, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<Invoice["status"], string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  issued: "bg-blue-100 text-blue-700 border-blue-300",
  partially_paid: "bg-amber-100 text-amber-700 border-amber-300",
  paid: "bg-green-100 text-green-700 border-green-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await InvoicesService().getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Could not load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = inv.reference.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openInvoiceDetail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setLoadingItems(true);
    try {
      const items = await InvoicesService().getInvoiceItems(invoice.id);
      setInvoiceItems(items);
    } catch (err) {
      console.error("Failed to fetch invoice items:", err);
      toast.error("Could not load invoice items");
      setInvoiceItems([]);
    } finally {
      setLoadingItems(false);
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all invoices.
        </p>
      </div>

      {/* Search and filter */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by reference..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No invoices found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoices ({filteredInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.reference}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[invoice.status]}>
                        {invoice.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell className={Number(invoice.outstanding) > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                      {formatCurrency(invoice.outstanding)}
                    </TableCell>
                    <TableCell>{invoice.issuedAt ? formatDateTime(invoice.issuedAt) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openInvoiceDetail(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.reference} · {selectedInvoice?.status.replace("_", " ")}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.discount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxes</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.taxes)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">{formatCurrency(selectedInvoice.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-medium text-red-600">{formatCurrency(selectedInvoice.outstanding)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Items</h3>
                {loadingItems ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : invoiceItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items found.</p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {invoiceItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 px-3 text-sm">
                        <span>{item.description || item.serviceName || "Item"}</span>
                        <span className="font-medium">{formatCurrency(item.amount || item.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
