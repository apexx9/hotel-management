"use client";

import { useEffect, useState } from "react";
import NotificationsService, {
  Notification,
} from "@/services/notifications.service";
import { formatDateTime } from "@/utils/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Bell,
  CheckCheck,
  Mail,
  MailOpen,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeColors: Record<Notification["type"], { bg: string; text: string; border: string }> = {
  checkout_overdue: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20" },
  payment_outstanding: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-500", border: "border-amber-500/20" },
  room_ready: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20" },
  room_unavailable: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20" },
  maintenance_issue: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20" },
  new_booking: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  guest_arrival: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  service_charge_added: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationsService().getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setError("Could not load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="space-y-8 p-2 md:p-6 max-w-7xl mx-auto animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-10 w-72 rounded-xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-3xl" />
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-10 p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">

      {/* ─── HERO HEADER ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full px-3 py-1 font-medium text-xs bg-muted/60 text-muted-foreground border-border/60"
          >
            Activity Feed
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Notifications
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed md:text-right hidden md:block">
            Stay updated on hotel activity and alerts.
          </p>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="h-11 rounded-full text-sm font-semibold border-border/60 hover:bg-muted/40"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              {markingAll ? "Marking..." : "Mark all read"}
            </Button>
          )}
        </div>
      </div>

      {/* ─── SUMMARY CARDS ────────────────────────────────────────────── */}
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
              "relative flex flex-col justify-between rounded-3xl p-6 transition-all hover:shadow-lg border",
              item.bg
            )}
          >
            <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4", item.color)}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </div>
            <div className="bg-background/80 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-sm">
              <p className={cn("text-4xl font-extrabold tracking-tight", item.color)}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Notifications</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── NOTIFICATIONS LIST ────────────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <Card className="rounded-3xl border border-border/50 bg-muted/20 shadow-sm flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
            <Info className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-1">You&apos;re all caught up.</p>
        </Card>
      ) : (
        <Card className="rounded-3xl border border-border/50 bg-card shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/40 pb-4 bg-muted/10">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              All Notifications ({notifications.length})
              {unreadCount > 0 && (
                <Badge variant="outline" className="ml-2 text-primary border-primary/30 bg-primary/10">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {notifications.map((notification) => {
                const style = typeColors[notification.type] || {
                  bg: "bg-muted",
                  text: "text-muted-foreground",
                  border: "border-border",
                };

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors",
                      !notification.isRead && "bg-primary/[0.02]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        notification.isRead ? "bg-muted/60 text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {notification.isRead ? (
                          <MailOpen className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "capitalize px-2 py-0 border font-semibold text-[10px]",
                              style.bg,
                              style.text,
                              style.border
                            )}
                          >
                            {notification.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="font-semibold text-foreground text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        {formatDateTime(notification.createdAt)}
                      </p>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={processingId === notification.id}
                          className="rounded-lg text-xs font-medium hover:bg-muted/40"
                        >
                          {processingId === notification.id
                            ? "Marking..."
                            : "Mark read"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
