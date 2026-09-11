"use client";

import { useEffect, useState } from "react";
import InvoicesService, { Invoice } from "@/services/invoices.service";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { invoiceStatusColors } from "@/lib/status-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/dashboard/page-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { PageLoading } from "@/components/dashboard/page-loading";
import { PageError } from "@/components/dashboard/page-error";
import { EmptyState } from "@/components/dashboard/empty-state";
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
import {
  AlertCircle,
  Search,
  FileText,
  Eye,
  Printer,
  Mail,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";


export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);

  const fetchInvoices = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await InvoicesService().getInvoices();
      setInvoices(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      if (!silent) setError("Could not load invoices. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useRealtimeRefresh(() => fetchInvoices(true));

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

  const openReceiptPreview = async (afterPrint = false) => {
    const invoice = selectedInvoice;
    if (!invoice || sendingReceipt) return;
    try {
      const html = await InvoicesService().getInvoiceReceipt(invoice.id);
      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Unable to open preview window");
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      if (afterPrint) {
        win.addEventListener(
          "load",
          () => {
            win.print();
          },
          { once: true },
        );
        setTimeout(() => win.print(), 600);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load receipt preview");
    }
  };

  const handleSendReceipt = async () => {
    const invoice = selectedInvoice;
    if (!invoice || sendingReceipt) return;
    setSendingReceipt(true);
    try {
      const result = await InvoicesService().sendInvoiceReceipt(invoice.id);
      if (result?.ok) {
        if (result?.skipped) {
          toast.info(
            result.info ??
              "Email delivery is not configured — receipt was not sent",
          );
        } else {
          toast.success(
            result.to
              ? `Receipt sent to ${result.to}`
              : "Receipt emailed successfully",
          );
        }
      } else {
        toast.error(result?.info ?? "Failed to send receipt");
      }
      fetchInvoices(true);
    } catch (err) {
      console.error("Failed to send receipt:", err);
      toast.error(
        "Failed to send receipt. Please check email settings and try again.",
      );
    } finally {
      setSendingReceipt(false);
    }
  };

  if (loading) {
    return <PageLoading showHeader showCards={1} />;
  }

  if (error) {
    return <PageError message={error} />;
  }

  return (
    <PageLayout>
      <PageHeader
        badge="Financial Management"
        title="Invoices"
        description="View and manage all invoices."
      />

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
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value || "all")}
          >
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
        <EmptyState
          title="No invoices found"
          description="There are no invoices matching your search criteria."
        />
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
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
                    <TableCell className="font-medium">
                      {invoice.reference}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          invoiceStatusColors[invoice.status].bg,
                          invoiceStatusColors[invoice.status].text,
                          invoiceStatusColors[invoice.status].border
                        )}
                      >
                        {invoice.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                    <TableCell
                      className={
                        Number(invoice.outstanding) > 0
                          ? "text-red-600 font-medium"
                          : "text-green-600"
                      }
                    >
                      {formatCurrency(invoice.outstanding)}
                    </TableCell>
                    <TableCell>
                      {invoice.issuedAt
                        ? formatDateTime(invoice.issuedAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openInvoiceDetail(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const url = `/api/invoices/${invoice.id}/receipt.pdf`;
                            window.open(url, "_blank");
                          }}
                        >
                          <FileText className="h-4 w-4" />
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

      {/* Invoice Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              {selectedInvoice?.reference} ·{" "}
              {selectedInvoice?.status.replace("_", " ")}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">
                    {formatCurrency(selectedInvoice.subtotal)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-medium">
                    {formatCurrency(selectedInvoice.discount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Taxes</p>
                  <p className="font-medium">
                    {formatCurrency(selectedInvoice.taxes)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {formatCurrency(selectedInvoice.total)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount Paid</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedInvoice.amountPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Outstanding</p>
                  <p className="font-medium text-red-600">
                    {formatCurrency(selectedInvoice.outstanding)}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    No items found.
                  </p>
                ) : (
                  <div className="border rounded-lg divide-y">
                    {invoiceItems.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 px-3 text-sm"
                      >
                        <span>
                          {item.description || item.serviceName || "Item"}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total ?? item.unitPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => openReceiptPreview(false)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openReceiptPreview(true)}
                    disabled={sendingReceipt}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!selectedInvoice) return;
                      const url = `/api/invoices/${selectedInvoice.id}/receipt.pdf`;
                      window.open(url, "_blank");
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={handleSendReceipt}
                    disabled={sendingReceipt}
                    className="ml-auto"
                  >
                    {sendingReceipt ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="mr-2 h-4 w-4" />
                    )}
                    {sendingReceipt ? "Sending…" : "Email Receipt"}
                  </Button>
                </div>
                {selectedInvoice.receiptEmailSentAt && (
                  <p className="text-xs text-muted-foreground">
                    Receipt last emailed on{" "}
                    {formatDateTime(selectedInvoice.receiptEmailSentAt)}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
