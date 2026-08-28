"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import NotificationsService from "@/services/notifications.service";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const notificationsService = NotificationsService();
        const notificationsData = await notificationsService.getNotifications();
        setNotifications(notificationsData);
        // Activity log would need to be loaded from an activity service
        setActivityLog([]);
      } catch (err) {
        console.error("Failed to load notifications data:", err);
        setError("Failed to load notifications data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications"
        title="Operational alerts"
        description="Monitor room readiness, payment issues, and other live hotel events."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading notifications data...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 xl:grid-cols-2">
          <SectionCard eyebrow="Alerts" title="Current notifications">
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((note) => (
                <div key={note.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[#0C0332]">{note.title}</p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">{note.message}</p>
                    </div>
                    <StatusChip label={note.isRead ? "Read" : "Unread"} tone={note.isRead ? "neutral" : "warning"} />
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                  No notifications.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard eyebrow="Activity" title="Audit trail">
            <div className="space-y-3">
              {activityLog.length > 0 ? activityLog.map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                  <p className="text-[13px] font-bold text-[#0C0332]">{entry.event}</p>
                  <p className="mt-1 text-[12px] text-[#6B6B6B]">
                    {entry.actorName} · {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              )) : (
                <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                  No activity logged.
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

