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
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Building2, Users, Bell } from "lucide-react";

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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

  const quickLinks = [
    {
      href: "/settings/hotel",
      label: "Hotel Settings",
      description: "Manage hotel profile and preferences.",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your hotel management system.
        </p>
      </div>

      {/* Current hotel summary */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Current Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Hotel Name</p>
              <p className="font-medium">{settings.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{settings.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{settings.phone || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">{settings.currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time Zone</p>
              <p className="font-medium">{settings.timezone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Check-in/Check-out</p>
              <p className="font-medium">{settings.checkInTime} / {settings.checkOutTime}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <link.icon className="h-4 w-4 text-muted-foreground" />
                  {link.label}
                </CardTitle>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
