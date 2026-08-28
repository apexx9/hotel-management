"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Banknote,
  BellRing,
  CalendarClock,
  Hotel,
  LogIn,
  LogOut,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import PageHeader from "@/components/operations/page-header";
import SectionCard from "@/components/operations/section-card";
import MetricCard from "@/components/operations/metric-card";
import StatusChip from "@/components/operations/status-chip";
import DashboardService from "@/services/dashboard.service";
import { formatCurrency, formatPercent } from "@/utils/hms.data";
import type { DashboardSummaryResponse } from "@/actions/operations";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const loadingMetrics = Array.from({ length: 9 }, (_, index) => index);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await DashboardService().getSummary();
        if (mounted) {
          setSummary(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Occupancy",
        value: formatPercent(summary.dashboardStats.occupancy),
        detail: `${summary.dashboardStats.occupiedRooms} occupied / ${summary.dashboardStats.availableRooms} available`,
        icon: Hotel,
      },
      {
        label: "Occupied rooms",
        value: String(summary.dashboardStats.occupiedRooms),
        detail: `${summary.dashboardStats.totalRooms} total rooms on property`,
        icon: Hotel,
      },
      {
        label: "Available rooms",
        value: String(summary.dashboardStats.availableRooms),
        detail: "Rooms ready for assignment now",
        icon: CalendarClock,
      },
      {
        label: "Revenue collected today",
        value: formatCurrency(summary.dashboardStats.revenueCollectedToday),
        detail: "Payments captured so far today",
        icon: Banknote,
      },
      {
        label: "Projected end-of-day revenue",
        value: formatCurrency(summary.dashboardStats.projectedEndOfDayRevenue),
        detail: "Includes expected remaining balances",
        icon: Sparkles,
      },
      {
        label: "Average Daily Rate",
        value: formatCurrency(summary.dashboardStats.averageDailyRate),
        detail: "Current occupied-room average",
        icon: Banknote,
      },
      {
        label: "RevPAR",
        value: formatCurrency(summary.dashboardStats.revPar),
        detail: "Revenue per available room",
        icon: Banknote,
      },
      {
        label: "Today's check-ins",
        value: String(summary.dashboardStats.todayCheckIns),
        detail: "Guests currently arriving or due",
        icon: LogIn,
      },
      {
        label: "Today's check-outs",
        value: String(summary.dashboardStats.todayCheckOuts),
        detail: "Departures scheduled for today",
        icon: LogOut,
      },
    ];
  }, [summary]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full">
      <div className="space-y-6">
        <motion.div variants={item}>
          <PageHeader
            eyebrow="Hotel command center"
            title="Operational dashboard"
            description="Monitor occupancy, arrivals, departures, revenue, housekeeping, and exceptions from one place."
          />
        </motion.div>

        {error && (
          <div className="rounded-2xl border border-[#F3D3D3] bg-[#FFF7F7] px-4 py-3 text-sm font-medium text-[#B42318]">
            {error}
          </div>
        )}

        <motion.div
          variants={item}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {isLoading
            ? loadingMetrics.map((value) => (
                <div
                  key={value}
                  className="h-[140px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white"
                />
              ))
            : metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </motion.div>

        {!isLoading && summary && (
          <>
            <motion.div variants={item} className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <SectionCard
                eyebrow="Revenue & occupancy"
                title="Today at a glance"
                description="Revenue, occupancy, and current business pressure."
                action={<StatusChip label="Live" tone="info" />}
              >
                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="rounded-2xl bg-[#0C0332] p-5 text-white">
                    <div className="flex items-center gap-2">
                      <Banknote size={15} className="text-[#8D80FF]" />
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA5C0]">
                        Revenue collected today
                      </p>
                    </div>

                    <p className="mt-4 text-4xl font-bold tracking-tight">
                      {formatCurrency(summary.dashboardStats.revenueCollectedToday)}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-[12px]">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[#AAA5C0]">Projected EOD</p>
                        <p className="mt-1 font-bold text-white">
                          {formatCurrency(summary.dashboardStats.projectedEndOfDayRevenue)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[#AAA5C0]">Current ADR</p>
                        <p className="mt-1 font-bold text-white">
                          {formatCurrency(summary.dashboardStats.averageDailyRate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Occupancy trend
                      </p>
                      <div className="mt-4 h-28 rounded-xl border border-dashed border-[#E8E8E8] bg-white/60 px-4 py-3">
                        <p className="text-[12px] text-[#6B6B6B]">
                          Backend summary is now authoritative for occupancy, revenue, arrivals, and departures.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Current cycle
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#0C0332]">
                        Live hotel operations
                      </p>
                      <p className="mt-1 text-[12px] leading-6 text-[#6B6B6B]">
                        {summary.dashboardStats.todayCheckIns} check-ins and {summary.dashboardStats.todayCheckOuts} check-outs are in scope today.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Attention"
                title="Operational exceptions"
                description="Items that need intervention from front desk, housekeeping, or finance."
              >
                <div className="space-y-4">
                  {summary.attentionItems.length > 0 ? (
                    summary.attentionItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#F0E8E8] bg-[#FFFDFD] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#0C0332]">
                              {item.title}
                            </p>
                            <p className="mt-1 text-[12px] leading-6 text-[#6B6B6B]">
                              {item.description}
                            </p>
                          </div>
                          <StatusChip label={item.type} tone="warning" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                      No active attention items.
                    </div>
                  )}
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item} className="grid gap-6 xl:grid-cols-2">
              <SectionCard
                eyebrow="Next arrival"
                title={
                  summary.nextArrival
                    ? `${summary.nextArrival.reference}`
                    : "No pending arrivals"
                }
                description={
                  summary.nextArrival
                    ? `Stay ${summary.nextArrival.reference} · Room ${summary.nextArrival.roomNumber ?? summary.nextArrival.roomId}`
                    : "Arrivals will appear here once they are scheduled."
                }
                action={
                  <StatusChip
                    label={summary.nextArrival ? summary.nextArrival.status : "idle"}
                    tone="info"
                  />
                }
              >
                {summary.nextArrival ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Guest details
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#0C0332]">
                        {summary.nextArrival.guestName ?? summary.nextArrival.reference}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        {summary.nextArrival.guestsCount} guest(s)
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Timing
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#0C0332]">
                        {new Date(summary.nextArrival.expectedCheckoutAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        Scheduled arrival / next turnaround.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No arrivals are queued right now.
                  </div>
                )}
              </SectionCard>

              <SectionCard
                eyebrow="Next departure"
                title={
                  summary.nextDeparture
                    ? `${summary.nextDeparture.reference}`
                    : "No active departures"
                }
                description={
                  summary.nextDeparture
                    ? `Stay ${summary.nextDeparture.reference} · Room ${summary.nextDeparture.roomNumber ?? summary.nextDeparture.roomId}`
                    : "Departures will appear once a guest is active."
                }
                action={
                  <StatusChip
                    label={summary.nextDeparture ? "active" : "idle"}
                    tone={Number(summary.nextDeparture?.outstandingBalance ?? 0) > 0 ? "warning" : "success"}
                  />
                }
              >
                {summary.nextDeparture ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Balance
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#0C0332]">
                        {formatCurrency(Number(summary.nextDeparture.outstandingBalance))}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        Settlement required before departure.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#FBFBFC] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                        Departure time
                      </p>
                      <p className="mt-2 text-[13px] font-semibold text-[#0C0332]">
                        {new Date(summary.nextDeparture.expectedCheckoutAt).toLocaleString()}
                      </p>
                      <p className="mt-1 text-[12px] text-[#6B6B6B]">
                        Scheduled from an active stay.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    No departures are queued right now.
                  </div>
                )}
              </SectionCard>
            </motion.div>

            <motion.div variants={item} className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <SectionCard
                eyebrow="Occupancy & rooms"
                title="Room pressure today"
                description="Rooms turning over, occupied inventory, and saleable capacity."
                action={<StatusChip label="Operational" tone="success" />}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Occupied
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0C0332]">
                      {summary.roomStatus.occupied}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Turning over
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0C0332]">
                      {summary.roomStatus.turningOver}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#FBFBFC] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                      Arrivals remaining
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#0C0332]">
                      {summary.roomStatus.checkInsRemaining}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#E8E8E8] bg-[#FBFBFC] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A8787]">
                    Sold-out risk
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-[#EDEDED]">
                    <div
                      className="h-2 rounded-full bg-[#1900FF]"
                      style={{
                        width: `${Math.min(100, summary.roomStatus.occupancy)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] text-[#6B6B6B]">
                    {summary.roomStatus.occupancy.toFixed(1)}% occupancy based on backend records.
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Housekeeping"
                title="Room readiness"
                description="Track cleaning, inspection, and rooms ready for sale."
              >
                <div className="space-y-3">
                  {[
                    ["cleaning", summary.housekeeping.cleaning],
                    ["inspection", summary.housekeeping.inspection],
                    ["ready", summary.housekeeping.ready],
                    ["maintenance", summary.housekeeping.maintenance],
                  ].map(([status, value]) => (
                    <div
                      key={String(status)}
                      className="flex items-center justify-between rounded-2xl bg-[#FBFBFC] p-4"
                    >
                      <span className="text-[13px] font-bold text-[#0C0332] capitalize">
                        {String(status)}
                      </span>
                      <StatusChip label={String(value)} tone="neutral" />
                    </div>
                  ))}
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item} className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <SectionCard
                eyebrow="Revenue by room type"
                title="Yield mix"
                description="Dynamic revenue split by each room type in the property."
              >
                <div className="space-y-4">
                  {summary.revenue.byRoomType.length > 0 ? (
                    summary.revenue.byRoomType.map((roomType) => (
                      <div key={roomType.id} className="flex items-center gap-4">
                        <span className="w-24 text-[12px] font-bold text-[#0C0332]">
                          {roomType.type}
                        </span>
                        <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#F1F1F1]">
                          <div className="h-full rounded-full bg-[#1900FF]" style={{ width: "100%" }} />
                        </div>
                        <span className="w-24 text-right text-[12px] font-bold text-[#0C0332]">
                          {formatCurrency(roomType.revenue)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                      No room type revenue has been recorded yet.
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard
                eyebrow="Recent activity"
                title="Operational trail"
                description="The most recent hotel actions across rooms, guests, housekeeping, and finance."
              >
                <div className="space-y-4">
                  {summary.recentActivity.length > 0 ? (
                    summary.recentActivity.map((log) => (
                      <div key={log.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-bold text-[#0C0332]">
                              {log.event}
                            </p>
                            <p className="mt-1 text-[12px] text-[#6B6B6B]">
                              {log.actorName ?? "System"} {log.description ? `· ${log.description}` : ""}
                            </p>
                          </div>
                          <StatusChip label={new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} tone="neutral" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                      No recent activity recorded.
                    </div>
                  )}
                </div>
              </SectionCard>
            </motion.div>

            <motion.div variants={item} className="grid gap-6 xl:grid-cols-3">
              <SectionCard eyebrow="Attention queue" title="Needs attention">
                <div className="space-y-3">
                  {summary.attentionItems.length > 0 ? (
                    summary.attentionItems.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-[#FBFBFC] p-4">
                        <p className="text-[13px] font-bold text-[#0C0332]">{item.title}</p>
                        <p className="mt-1 text-[12px] text-[#6B6B6B]">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                      No active attention items.
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard eyebrow="Notifications" title="Live alerts">
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#FBFBFC] p-4 text-[12px] text-[#6B6B6B]">
                    Alert feed is driven by backend notifications.
                  </div>
                </div>
              </SectionCard>

              <SectionCard eyebrow="Quick status" title="Live counts">
                <div className="space-y-3 text-[12px] text-[#6B6B6B]">
                  <div className="flex items-center justify-between rounded-2xl bg-[#FBFBFC] p-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-[#0C0332]">
                      <LogIn size={14} className="text-[#1900FF]" />
                      Arrivals today
                    </span>
                    <span>{summary.dashboardStats.todayCheckIns}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#FBFBFC] p-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-[#0C0332]">
                      <LogOut size={14} className="text-[#1900FF]" />
                      Departures today
                    </span>
                    <span>{summary.dashboardStats.todayCheckOuts}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#FBFBFC] p-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-[#0C0332]">
                      <BellRing size={14} className="text-[#1900FF]" />
                      Rooms out of service
                    </span>
                    <span>{summary.roomStatus.total - summary.roomStatus.available - summary.roomStatus.occupied}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-[#FBFBFC] p-4">
                    <span className="inline-flex items-center gap-2 font-semibold text-[#0C0332]">
                      <ShieldAlert size={14} className="text-[#1900FF]" />
                      Unresolved balances
                    </span>
                    <span>{summary.attentionItems.length}</span>
                  </div>
                </div>
              </SectionCard>
            </motion.div>
          </>
        )}

        {isLoading && (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="h-[240px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />
            <div className="h-[240px] animate-pulse rounded-2xl border border-[#E8E8E8] bg-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
