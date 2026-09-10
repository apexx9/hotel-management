"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SettingsService from "@/services/settings.service";
import RoomsService, { Room, RoomType } from "@/services/rooms.service";
import NotificationsService, {
  AppNotification,
} from "@/services/notifications.service";
import type { HotelSettingsResponse } from "@/actions/operations";
import { formatDateTime } from "@/utils/utils";
import { notificationTypeColors } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoading } from "@/components/dashboard/page-loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Info,
  LayoutDashboard,
  Map,
  Mail,
  MailOpen,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type SettingsTab = "overview" | "notifications";

export default function SettingsOverviewPage() {
  return (
    <Suspense
      fallback={<PageLoading showHeader showCards={3} />}
    >
      <SettingsOverviewContent />
    </Suspense>
  );
}

function SettingsOverviewContent() {
  const searchParams = useSearchParams();
  const activeTab: SettingsTab =
    searchParams.get("tab") === "notifications" ? "notifications" : "overview";

  const [settings, setSettings] = useState<HotelSettingsResponse | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);
      const data = await NotificationsService().getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotificationsError("Could not load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        setLoading(true);
        const [settingsData, roomTypesData, roomsData] = await Promise.all([
          SettingsService().getSettings(),
          RoomsService().getRoomTypes(),
          RoomsService().getRooms(),
        ]);
        setSettings(settingsData);
        setRoomTypes(roomTypesData);
        setRooms(roomsData);
      } catch (err) {
        console.error("Failed to fetch setup data:", err);
        setError("Could not load settings overview. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSetupData();
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    setProcessingId(id);
    try {
      await NotificationsService().markAsRead(id);
      toast.success("Notification marked as read");
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      toast.error("Failed to update notification");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await NotificationsService().markAllAsRead();
      toast.success("All notifications marked as read");
      await fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      toast.error("Failed to update notifications");
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const floorCount = new Set(rooms.map((room) => room.floor).filter(Boolean)).size;

  const setupChecklist = [
    {
      title: "Hotel settings",
      description: "Hotel profile, policies, tax rules, and check-in times.",
      done: Boolean(
        settings?.name &&
          settings?.currency &&
          settings?.timezone &&
          settings?.checkInTime &&
          settings?.checkOutTime,
      ),
      href: "/settings/hotel",
      icon: Building2,
    },
    {
      title: "Room types",
      description: "Create categories like Standard, Deluxe, Suite.",
      done: roomTypes.length > 0,
      href: "/rooms/types",
      icon: BedDouble,
    },
    {
      title: "Floors & rooms",
      description: `${rooms.length} rooms across ${floorCount} floors ready for booking.`,
      done: rooms.length > 0 && floorCount > 0,
      href: "/rooms",
      icon: Map,
    },
  ];

  const quickLinks = [
    {
      href: "/settings/hotel",
      label: "Hotel Settings",
      description: "Manage hotel profile, operations, and policies.",
      icon: Building2,
    },
    {
      href: "/rooms",
      label: "Rooms & Floors",
      description:
        "Add rooms to each floor and keep the hotel inventory aligned.",
      icon: BedDouble,
    },
    {
      href: "/rooms/types",
      label: "Room Types",
      description: "Create room categories that appear in booking forms.",
      icon: BedDouble,
    },
    {
      href: "/settings/staff",
      label: "Staff",
      description: "Invite and manage staff members.",
      icon: Users,
    },
    {
      href: "/settings?tab=notifications",
      label: "Notifications",
      description: "Review hotel alerts and message history.",
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

  const notificationStyle = (type: AppNotification["type"]) =>
    notificationTypeColors[type] || {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    };

  if (loading) {
    return <PageLoading showHeader showCards={3} />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/30 bg-destructive/10"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-semibold">System Notice</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-2 sm:p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            System Configuration
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Settings
          </h1>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground md:text-right">
          Configure your hotel management system, team, and notification
          preferences.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-border/40 pb-2">
        <Link
          href="/settings"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "overview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          Overview
        </Link>
        <Link
          href="/settings?tab=notifications"
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            activeTab === "notifications"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          Notifications
        </Link>
      </div>

      {activeTab === "overview" ? (
        <>
          <Card className="overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="border-b border-primary/10 bg-primary/5 pb-4">
              <CardTitle className="flex items-center justify-between gap-2 text-base font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Hotel setup checklist
                </span>
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-background text-primary"
                >
                  {setupChecklist.filter((item) => item.done).length}/
                  {setupChecklist.length} complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {setupChecklist.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.title} href={item.href} className="group block">
                      <div
                        className={cn(
                          "rounded-2xl border p-4 transition-all",
                          item.done
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-border bg-card hover:border-primary/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl",
                                item.done
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          {item.done ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <LayoutDashboard className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="group block">
                <div className="relative flex h-full flex-col justify-between rounded-3xl border border-border/50 bg-muted/40 p-6 transition-all hover:border-border hover:shadow-lg">
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </div>

                    <div className="mb-6 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-transform group-hover:-translate-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm font-medium text-primary">
                    Configure
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {settings && (
            <Card className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Building2 className="h-5 w-5 text-primary" />
                  Current Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {configItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {notificationsLoading && notifications.length === 0 ? (
            <Skeleton className="h-72 w-full rounded-3xl" />
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Total",
                value: notifications.length,
                icon: Bell,
                color: "text-foreground",
                bg: "bg-muted/40 border-border/50",
              },
              {
                label: "Unread",
                value: unreadCount,
                icon: Mail,
                color: "text-primary",
                bg: "bg-primary/5 border-primary/20",
              },
              {
                label: "Read",
                value: notifications.length - unreadCount,
                icon: MailOpen,
                color: "text-emerald-600",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
            ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "relative flex flex-col justify-between rounded-3xl border p-6 transition-all hover:shadow-lg",
                    item.bg,
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider",
                      item.color,
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur-md">
                    <p className={cn("text-4xl font-extrabold tracking-tight", item.color)}>
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Notifications</p>
                  </div>
                </div>
            ))}
            </div>
          )}

          {notificationsError ? (
            <Alert
              variant="destructive"
              className="rounded-2xl border-destructive/30 bg-destructive/10"
            >
              <AlertCircle className="h-5 w-5" />
              <AlertTitle className="font-semibold">System Notice</AlertTitle>
              <AlertDescription>{notificationsError}</AlertDescription>
            </Alert>
          ) : null}

          {notifications.length === 0 ? (
            <Card className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-border/50 bg-muted/20 p-12 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Info className="h-6 w-6" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No notifications yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                <CardTitle className="flex items-center justify-between gap-2 text-base font-bold">
                  <span className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    All Notifications ({notifications.length})
                  </span>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-primary"
                      >
                        {unreadCount} unread
                      </Badge>
                    ) : null}
                    {unreadCount > 0 ? (
                      <Button
                        variant="outline"
                        onClick={handleMarkAllAsRead}
                        disabled={markingAll}
                        className="h-10 rounded-full border-border/60 text-sm font-semibold hover:bg-muted/40"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {markingAll ? "Marking..." : "Mark all read"}
                      </Button>
                    ) : null}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/30">
                  {notifications.map((notification) => {
                    const style = notificationStyle(notification.type);

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/20",
                          !notification.isRead && "bg-primary/[0.02]",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              notification.isRead
                                ? "bg-muted/60 text-muted-foreground"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {notification.isRead ? (
                              <MailOpen className="h-4 w-4" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border font-semibold capitalize px-2 py-0 text-[10px]",
                                  style.bg,
                                  style.text,
                                  style.border,
                                )}
                              >
                                {notification.type.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {notification.message}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(notification.createdAt)}
                          </p>
                          {!notification.isRead ? (
                            <Button
                              variant="outline"
                              className="h-9 rounded-full border-border/60 text-xs font-semibold"
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={processingId === notification.id}
                            >
                              Mark read
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {settings && (
            <Card className="overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm">
              <CardHeader className="border-b border-border/40 bg-muted/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <Building2 className="h-5 w-5 text-primary" />
                  Current Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {configItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-2xl border border-border/40 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
