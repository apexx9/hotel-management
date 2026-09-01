"use client";

import { useEffect, useState } from "react";
import InvoicesService, { Invoice } from "@/services/invoices.service";
import PaymentsService, { Payment } from "@/services/payments.service";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { AlertCircle, ArrowRight, Wallet, FileText, CreditCard, TrendingUp } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { cn } from "@/lib/utils";

export default function FinanceOverviewPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invoiceData, paymentData] = await Promise.all([
          InvoicesService().getInvoices(),
          PaymentsService().getPayments(),
        ]);
        setInvoices(invoiceData);
        setPayments(paymentData);
      } catch (err) {
        console.error("Failed to fetch finance data:", err);
        setError("Could not load finance overview. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
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

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.outstanding), 0);
  const totalPayments = payments.reduce((sum, pay) => sum + Number(pay.amount), 0);

  const summaryCards = [
    {
      label: "Total Invoiced",
      value: formatCurrency(totalInvoiced),
      icon: FileText,
      href: "/finance/invoices",
      color: "text-blue-600",
    },
    {
      label: "Total Payments",
      value: formatCurrency(totalPayments),
      icon: CreditCard,
      href: "/finance/payments",
      color: "text-green-600",
    },
    {
      label: "Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: Wallet,
      href: "/finance/invoices",
      color: "text-red-600",
    },
    {
      label: "Net Revenue",
      value: formatCurrency(totalPaid),
      icon: TrendingUp,
      href: "/finance/reports",
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Monitor invoices, payments, and financial performance.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  View details <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent invoices and payments */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Invoices
              </span>
              <Link href="/finance/invoices" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No invoices found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.slice(0, 5).map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.reference}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className={Number(invoice.outstanding) > 0 ? "text-red-600" : "text-green-600"}>
                        {formatCurrency(invoice.outstanding)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.status.replace("_", " ")}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Payments
              </span>
              <Link href="/finance/payments" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No payments found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 5).map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.reference}</TableCell>
                      <TableCell className="capitalize">{payment.method.replace("_", " ")}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
