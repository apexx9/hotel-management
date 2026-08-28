"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import StatusChip from "@/components/operations/status-chip";
import HousekeepingService from "@/services/housekeeping.service";

const columns = [
  { key: "cleaning", title: "Cleaning" },
  { key: "inspection", title: "Inspection" },
  { key: "ready", title: "Ready" },
  { key: "maintenance", title: "Maintenance" },
];

export default function HousekeepingPage() {
  const [housekeepingTasks, setHousekeepingTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const housekeepingService = HousekeepingService();
        const tasksData = await housekeepingService.getHousekeepingTasks();
        setHousekeepingTasks(tasksData);
      } catch (err) {
        console.error("Failed to load housekeeping data:", err);
        setError("Failed to load housekeeping data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Housekeeping"
        title="Room readiness workflow"
        description="Move rooms through cleaning, inspection, ready, and maintenance states."
      />

      {error && (
        <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 text-center">
          <p className="text-[#6B6B6B]">Loading housekeeping data...</p>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6 xl:grid-cols-4">
          {columns.map((column) => (
            <SectionCard key={column.key} eyebrow="Status" title={column.title}>
              <div className="space-y-3">
                {housekeepingTasks
                  .filter((task) => task.status === column.key)
                  .map((task) => (
                    <div key={task.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[13px] font-bold text-[#0C0332]">
                        Room {task.roomId}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">{task.note || "No notes"}</p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <StatusChip label={task.assignedToUserId ? "Assigned" : "Unassigned"} tone="neutral" />
                        <StatusChip label={task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"} tone="info" />
                      </div>
                    </div>
                  ))}
                {housekeepingTasks.filter((task) => task.status === column.key).length === 0 && (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No tasks in {column.title.toLowerCase()}.
                  </div>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}

