"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";

import DashboardHeader from "./dashboard-header";
import DashboardMetrics from "./dashboard-metrics";
import ArrivalsPanel from "./arrivals-panel";
import DeparturesPanel from "./departures-panel";
import RoomStatusPanel from "./room-status-panel";
import RevenuePanel from "./revenue-panel";
import HousekeepingPanel from "./housekeeping-panel";
import AttentionPanel from "./attention-panel";
import ActivityPanel from "./activity-panel";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="border-b bg-white px-6 py-8">
        <div className="h-3 w-24 bg-zinc-200" />
        <div className="mt-4 h-8 w-48 bg-zinc-200" />
        <div className="mt-2 h-4 w-80 bg-zinc-100" />
      </div>

      <div className="grid border-b bg-white md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="border-r border-zinc-200 px-5 py-6"
          >
            <div className="h-3 w-20 bg-zinc-200" />
            <div className="mt-5 h-7 w-24 bg-zinc-200" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 border bg-white"
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const {
    data,
    isLoading,
    error,
    refresh,
  } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[600px] items-center justify-center px-6">
        <div className="w-full max-w-md border bg-white p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center bg-red-50">
            <AlertCircle
              size={18}
              className="text-red-500"
            />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-[#0C0332]">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-xs leading-5 text-zinc-400">
            We couldn&apos;t retrieve the latest hotel
            operations data. Check the connection and try
            again.
          </p>

          <Button
            onClick={refresh}
            className="mt-5 h-9 gap-2 rounded-none bg-[#1900FF] text-xs"
          >
            <RefreshCw size={14} />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <DashboardHeader
        onRefresh={refresh}
        refreshing={isLoading}
      />

      <DashboardMetrics stats={data.dashboardStats} />

      <div className="space-y-5 p-6">
        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <ArrivalsPanel arrivals={data.arrivals} />
          <RoomStatusPanel roomStatus={data.roomStatus} />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <DeparturesPanel departures={data.departures} />
          <HousekeepingPanel
            housekeeping={data.housekeeping}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <RevenuePanel revenue={data.revenue} />
          <AttentionPanel items={data.attentionItems} />
        </div>

        <ActivityPanel activities={data.recentActivity} />
      </div>
    </div>
  );
}
