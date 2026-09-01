"use client";

import { useEffect, useState } from "react";
import SettingsService from "@/services/settings.service";
import type { HotelSettingsResponse } from "@/actions/operations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AlertCircle, Building2, Save } from "lucide-react";
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
          taxRate: data.taxRate,
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
        taxRate: form.taxRate,
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || "Something went wrong."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hotel Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your hotel profile and preferences.
        </p>
      </div>

      {/* Hotel profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Hotel Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Hotel Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Operational settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Operations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Time Zone</Label>
            <Input
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(value) => setForm({ ...form, currency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
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
            <Label>Language</Label>
            <Select
              value={form.language}
              onValueChange={(value) => setForm({ ...form, language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Check-in Time</Label>
            <Input
              type="time"
              value={form.checkInTime}
              onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Check-out Time</Label>
            <Input
              type="time"
              value={form.checkOutTime}
              onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Accepted Payment Methods</Label>
            <Input
              placeholder="Comma-separated list"
              value={form.acceptedPaymentMethods}
              onChange={(e) =>
                setForm({ ...form, acceptedPaymentMethods: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Policies and preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Policies & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Booking Policy</Label>
            <Input
              value={form.bookingPolicy}
              onChange={(e) => setForm({ ...form, bookingPolicy: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="guestIdRequired"
              checked={form.guestIdRequired}
              onChange={(e) =>
                setForm({ ...form, guestIdRequired: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="guestIdRequired">
              Require guest ID at check-in
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
