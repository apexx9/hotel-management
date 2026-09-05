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
import { AlertCircle, ArrowRight, Wallet, FileText, CreditCard, TrendingUp, DollarSign } from "lucide-react";
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
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Total Payments",
      value: formatCurrency(totalPayments),
      icon: CreditCard,
      href: "/finance/payments",
      color: "text-emerald-600",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Outstanding",
      value: formatCurrency(totalOutstanding),
      icon: Wallet,
      href: "/finance/invoices",
      color: "text-amber-600 dark:text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Net Revenue",
      value: formatCurrency(totalPaid),
      icon: TrendingUp,
      href: "/finance/reports",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Financial Dashboard
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Finance Overview
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Monitor your property's revenue, outstanding balances, and recent payment activity.
        </p>
      </div>

      {/* ─── SUMMARY CARDS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href} className="group block">
            <div className={cn("relative flex flex-col justify-between rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 h-full border", card.bg)}>
              <div>
                <div className={cn("flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-4", card.color)}>
                  <span className="flex items-center gap-2"><card.icon className="h-4 w-4" /> {card.label}</span>
                </div>
                
                <div className="bg-background/80 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-sm space-y-1">
                  <p className={cn("text-3xl font-extrabold tracking-tight truncate", card.color)}>{card.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                    View details <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── DATA TABLES ────────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Invoices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Recent Invoices
            </h2>
            <Link href="/finance/invoices" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1 rounded-full">
              View all
            </Link>
          </div>
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden h-full">
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No invoices generated</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider pl-6">Reference</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Total</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Outstanding</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 5).map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground pl-6">{invoice.reference}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell className={Number(invoice.outstanding) > 0 ? "text-amber-600 font-semibold" : "text-emerald-600 font-medium"}>
                            {formatCurrency(invoice.outstanding)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                              invoice.status === 'partially_paid' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                              'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }>
                              {invoice.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" /> Recent Payments
            </h2>
            <Link href="/finance/payments" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1 rounded-full">
              View all
            </Link>
          </div>
          <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden h-full">
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                  <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="text-lg font-medium text-foreground">No payments received</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold text-xs uppercase tracking-wider pl-6">Reference</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Method</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Amount</TableHead>
                        <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 5).map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-semibold text-foreground pl-6">{payment.reference}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize bg-muted/50 border border-border/50 text-xs text-muted-foreground">
                              {payment.method.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">+{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(payment.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
