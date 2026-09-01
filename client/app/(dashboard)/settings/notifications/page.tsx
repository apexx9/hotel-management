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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Bell, CheckCheck, Mail, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeColors: Record<Notification["type"], string> = {
  checkout_overdue: "bg-red-100 text-red-700 border-red-300",
  payment_outstanding: "bg-amber-100 text-amber-700 border-amber-300",
  room_ready: "bg-green-100 text-green-700 border-green-300",
  room_unavailable: "bg-gray-100 text-gray-700 border-gray-300",
  maintenance_issue: "bg-orange-100 text-orange-700 border-orange-300",
  new_booking: "bg-blue-100 text-blue-700 border-blue-300",
  guest_arrival: "bg-indigo-100 text-indigo-700 border-indigo-300",
  service_charge_added: "bg-purple-100 text-purple-700 border-purple-300",
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on hotel activity and alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {markingAll ? "Marking..." : "Mark all as read"}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications ({notifications.length})
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} unread
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    className={cn(!notification.isRead && "bg-muted/50")}
                  >
                    <TableCell>
                      {notification.isRead ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={typeColors[notification.type]}
                      >
                        {notification.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                    </TableCell>
                    <TableCell>{formatDateTime(notification.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={processingId === notification.id}
                        >
                          {processingId === notification.id
                            ? "Marking..."
                            : "Mark read"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
