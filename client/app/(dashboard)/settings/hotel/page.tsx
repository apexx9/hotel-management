"use client";

import { useEffect, useState } from "react";
import SettingsService from "@/services/settings.service";
import type { HotelSettingsResponse } from "@/actions/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Building2,
  Save,
  Globe,
  Clock,
  CreditCard,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState<HotelSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (all fields)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    timezone: "UTC",
    currency: "USD",
    language: "en",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    bookingPolicy: "",
    guestIdRequired: true,
    taxRate: "0",
    invoicePrefix: "INV-",
    acceptedPaymentMethods: "",
    serviceConfig: "",
    notificationPrefs: "",
    systemPrefs: "",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await SettingsService().getSettings();
        setSettings(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          timezone: data.timezone,
          currency: data.currency,
          language: data.language,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          bookingPolicy: data.bookingPolicy || "",
          guestIdRequired: data.guestIdRequired,
          taxRate: String(data.taxRate ?? "0"),
          invoicePrefix: data.invoicePrefix,
          acceptedPaymentMethods: data.acceptedPaymentMethods || "",
          serviceConfig: data.serviceConfig || "",
          notificationPrefs: data.notificationPrefs || "",
          systemPrefs: data.systemPrefs || "",
        });
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Could not load hotel settings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedTaxRate = form.taxRate ? parseFloat(String(form.taxRate)) : 0;
      await SettingsService().updateSettings({
        name: form.name || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        timezone: form.timezone,
        currency: form.currency,
        language: form.language,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        bookingPolicy: form.bookingPolicy || null,
        guestIdRequired: form.guestIdRequired,
        taxRate: Number.isNaN(parsedTaxRate) ? 0 : parsedTaxRate,
        invoicePrefix: form.invoicePrefix,
        acceptedPaymentMethods: form.acceptedPaymentMethods || null,
        serviceConfig: form.serviceConfig || null,
        notificationPrefs: form.notificationPrefs || null,
        systemPrefs: form.systemPrefs || null,
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-72 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/30 bg-destructive/10"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>
            {error || "Something went wrong."}
          </AlertDescription>
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
            System Configuration
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Hotel Settings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right hidden md:block">
            Configure your hotel profile, operational parameters, and guest
            policies.
          </p>
          <a
            href="/finance/reports"
            className="inline-flex items-center rounded-full border border-border/40 bg-muted/10 px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Generate Reports
          </a>
        </div>
      </div>

      {/* ─── HOTEL PROFILE ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Hotel Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Hotel Name
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                type="email"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Address
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── OPERATIONS ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Time Zone
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Currency
              </Label>
              <Select
                value={form.currency}
                onValueChange={(value) =>
                  setForm({ ...form, currency: value || "USD" })
                }
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="GHS">GHS</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Language
              </Label>
              <Select
                value={form.language}
                onValueChange={(value) =>
                  setForm({ ...form, language: value || "en" })
                }
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Check-in Time
              </Label>
              <Input
                type="time"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.checkInTime}
                onChange={(e) =>
                  setForm({ ...form, checkInTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Check-out Time
              </Label>
              <Input
                type="time"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.checkOutTime}
                onChange={(e) =>
                  setForm({ ...form, checkOutTime: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tax Rate (%)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invoice Prefix
              </Label>
              <Input
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.invoicePrefix}
                onChange={(e) =>
                  setForm({ ...form, invoicePrefix: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Accepted Payment Methods
              </Label>
              <Input
                placeholder="Comma-separated list"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.acceptedPaymentMethods}
                onChange={(e) =>
                  setForm({ ...form, acceptedPaymentMethods: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── POLICIES & PREFERENCES ────────────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Policies & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Booking Policy
            </Label>
            <Input
              className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              value={form.bookingPolicy}
              onChange={(e) =>
                setForm({ ...form, bookingPolicy: e.target.value })
              }
            />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-border/40 p-4">
            <input
              type="checkbox"
              id="guestIdRequired"
              checked={form.guestIdRequired}
              onChange={(e) =>
                setForm({ ...form, guestIdRequired: e.target.checked })
              }
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label
              htmlFor="guestIdRequired"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Require guest ID at check-in
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* ─── SAVE ACTION ────────────────────────────────────────────── */}
      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-8 rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
