"use client";

import { useEffect, useState } from "react";
import SettingsService from "@/services/settings.service";
import type { HotelSettingsResponse } from "@/actions/operations";
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
  AlertCircle,
  ArrowRight,
  Building2,
  Users,
  Bell,
  Globe,
  Clock,
  CreditCard,
  Info,
} from "lucide-react";

export default function SettingsOverviewPage() {
  const [settings, setSettings] = useState<HotelSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await SettingsService().getSettings();
        setSettings(data);
      } catch (err) {
        console.error("Failed to fetch settings:", err);
        setError("Could not load settings overview. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-96 rounded-xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-3xl" />
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

  const quickLinks = [
    {
      href: "/settings/hotel",
      label: "Hotel Settings",
      description: "Manage hotel profile, operations, and policies.",
      icon: Building2,
    },
    {
      href: "/settings/staff",
      label: "Staff",
      description: "Invite and manage staff members.",
      icon: Users,
    },
    {
      href: "/settings/notifications",
      label: "Notifications",
      description: "Configure notification preferences.",
      icon: Bell,
    },
  ];

  const configItems = settings
    ? [
        { label: "Hotel Name", value: settings.name || "—", icon: Building2 },
        { label: "Email", value: settings.email || "—", icon: Bell },
        { label: "Phone", value: settings.phone || "—", icon: Info },
        { label: "Currency", value: settings.currency, icon: CreditCard },
        { label: "Time Zone", value: settings.timezone, icon: Globe },
        {
          label: "Check-in / Check-out",
          value: `${settings.checkInTime} / ${settings.checkOutTime}`,
          icon: Clock,
        },
      ]
    : [];

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
            Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right">
          Configure your hotel management system, team, and notification preferences.
        </p>
      </div>

      {/* ─── QUICK LINKS ────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="group block">
            <div className="relative flex flex-col justify-between rounded-3xl bg-muted/40 border border-border/50 p-6 transition-all hover:shadow-lg hover:border-border h-full">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  <link.icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </div>

                <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm mb-6 transition-transform group-hover:-translate-y-1">
                  <p className="text-sm text-foreground font-medium">{link.description}</p>
                </div>
              </div>

              <div className="flex items-center text-sm font-medium text-primary">
                Configure <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ─── CURRENT CONFIGURATION ────────────────────────────────────────────── */}
      {settings && (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {configItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-2xl bg-muted/30 border border-border/40 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
