"use client";

import { useEffect, useState } from "react";
import SettingsService from "@/services/settings.service";
import type { HotelSettingsResponse } from "@/actions/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/dashboard/page-loading";
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
  Mail,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function HotelSettingsPage() {
  const [settings, setSettings] = useState<HotelSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");

  // Form state (all fields)
  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
    currency: string;
    language: string;
    checkInTime: string;
    checkOutTime: string;
    bookingPolicy: string;
    guestIdRequired: boolean;
    taxRate: string;
    defaultTaxType: "value" | "percentage";
    defaultTaxValue: string;
    defaultDiscountType: "value" | "percentage";
    defaultDiscountValue: string;
    invoicePrefix: string;
    acceptedPaymentMethods: string;
    serviceConfig: string;
    notificationPrefs: string;
    systemPrefs: string;
    logoUrl: string;
    emailFrom: string;
    emailFromName: string;
    primaryColor: string;
    accentColor: string;
  }>({
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
    defaultTaxType: "value",
    defaultTaxValue: "0",
    defaultDiscountType: "value",
    defaultDiscountValue: "0",
    invoicePrefix: "INV-",
    acceptedPaymentMethods: "",
    serviceConfig: "",
    notificationPrefs: "",
    systemPrefs: "",
    logoUrl: "",
    emailFrom: "",
    emailFromName: "",
    primaryColor: "#1900ff",
    accentColor: "#0ea5e9",
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
          defaultTaxType: data.defaultTaxType ?? "value",
          defaultTaxValue: String(data.defaultTaxValue ?? "0"),
          defaultDiscountType: data.defaultDiscountType ?? "value",
          defaultDiscountValue: String(data.defaultDiscountValue ?? "0"),
          invoicePrefix: data.invoicePrefix,
          acceptedPaymentMethods: data.acceptedPaymentMethods || "",
          serviceConfig: data.serviceConfig || "",
          notificationPrefs: data.notificationPrefs || "",
          systemPrefs: data.systemPrefs || "",
          logoUrl: data.logoUrl || "",
          emailFrom: data.emailFrom || "",
          emailFromName: data.emailFromName || "",
          primaryColor: data.primaryColor || "#1900ff",
          accentColor: data.accentColor || "#0ea5e9",
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
      const parsedDefaultTaxValue = form.defaultTaxValue
        ? parseFloat(String(form.defaultTaxValue))
        : 0;
      const parsedDefaultDiscountValue = form.defaultDiscountValue
        ? parseFloat(String(form.defaultDiscountValue))
        : 0;
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
        defaultTaxType: form.defaultTaxType,
        defaultTaxValue: Number.isNaN(parsedDefaultTaxValue)
          ? 0
          : parsedDefaultTaxValue,
        defaultDiscountType: form.defaultDiscountType,
        defaultDiscountValue: Number.isNaN(parsedDefaultDiscountValue)
          ? 0
          : parsedDefaultDiscountValue,
        invoicePrefix: form.invoicePrefix,
        acceptedPaymentMethods: form.acceptedPaymentMethods || null,
        serviceConfig: form.serviceConfig || null,
        notificationPrefs: form.notificationPrefs || null,
        systemPrefs: form.systemPrefs || null,
        logoUrl: form.logoUrl.trim() || null,
        emailFrom: form.emailFrom.trim() || null,
        emailFromName: form.emailFromName.trim() || null,
        primaryColor: form.primaryColor || null,
        accentColor: form.accentColor || null,
      });
      toast.success("Settings updated successfully");
    } catch (err) {
      console.error("Failed to update settings:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const result = await SettingsService().testEmail(
        testRecipient.trim() || undefined,
      );
      if (result?.ok) {
        if (result.skipped) {
          toast.info(
            result.info ||
              "Email delivery is not configured — the platform SMTP server is not set up.",
          );
        } else {
          toast.success(
            result.to
              ? `Test email sent to ${result.to}`
              : "Test email sent successfully",
          );
        }
      } else {
        toast.error(
          result?.error ||
            "Failed to send test email. Please try again.",
        );
      }
    } catch (err) {
      console.error("Failed to send test email:", err);
      toast.error(
        "Failed to send test email. Please try again.",
      );
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return <PageLoading showHeader showCards={3} />;
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
                Default Tax Mode
              </Label>
              <Select
                value={form.defaultTaxType}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    defaultTaxType:
                      value === "percentage" ? "percentage" : "value",
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select tax mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="value">Fixed value</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Tax Value
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.defaultTaxValue}
                onChange={(e) =>
                  setForm({ ...form, defaultTaxValue: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Discount Mode
              </Label>
              <Select
                value={form.defaultDiscountType}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    defaultDiscountType:
                      value === "percentage" ? "percentage" : "value",
                  })
                }
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                  <SelectValue placeholder="Select discount mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="value">Fixed value</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Default Discount Value
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.defaultDiscountValue}
                onChange={(e) =>
                  setForm({ ...form, defaultDiscountValue: e.target.value })
                }
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

      {/* ─── EMAIL & BRANDING ─────────────────────────────────────── */}
      <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Emails (booking confirmations, receipts, staff invitations) are sent
            from the platform&apos;s verified sending domain, shown with your{" "}
            <span className="font-medium text-foreground">
              Sender Name
            </span>{" "}
            (defaults to your company name). Set the{" "}
            <span className="font-medium text-foreground">Reply-To Email</span>{" "}
            guests should write back to, plus the logo and colors used in your
            emails and receipts. Providers are managed on the platform — no
            SMTP setup needed.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sender Name
              </Label>
              <Input
                placeholder="My Hotel"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.emailFromName}
                onChange={(e) =>
                  setForm({ ...form, emailFromName: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Displayed as the sender before the platform address, e.g.{" "}
                <span className="font-mono">
                  &quot;My Hotel&quot; &lt;notifications@yourplatform.com&gt;
                </span>{" "}
                Defaults to your company name.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reply-To Email
              </Label>
              <Input
                type="email"
                placeholder="hello@yourhotel.com"
                className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={form.emailFrom}
                onChange={(e) =>
                  setForm({ ...form, emailFrom: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Where guest replies land. Falls back to your contact email.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logo URL
            </Label>
            <Input
              type="url"
              placeholder="https://yourhotel.com/logo.png"
              className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Shown at the top of receipts and in the email header. Use a
              hosted URL (PNG or SVG).
            </p>
            {form.logoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl.trim()}
                alt="Logo preview"
                className="mt-2 h-12 w-auto max-w-[240px] object-contain border border-border/40 rounded-lg p-2 bg-muted/20"
              />
            ) : null}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Primary Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) =>
                    setForm({ ...form, primaryColor: e.target.value })
                  }
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border/50 bg-muted/30 p-1"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {form.primaryColor}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Header banner, buttons, and accents in emails and receipts.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Accent Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) =>
                    setForm({ ...form, accentColor: e.target.value })
                  }
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border/50 bg-muted/30 p-1"
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {form.accentColor}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Secondary highlight color (divider lines, subtle accents).
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-muted/20 border border-border/40 p-4 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Test Recipient
              </Label>
              <Input
                type="email"
                placeholder={
                  settings.email || "Leave empty to use the hotel email"
                }
                className="h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
              />
            </div>
            <div className="text-xs text-muted-foreground pb-2">
              Save changes first, then send a test email.
            </div>
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={testingEmail}
              className="h-10 rounded-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {testingEmail ? "Sending…" : "Send Test Email"}
            </Button>
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
