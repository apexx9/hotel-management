"use client";

import { useState } from "react";
import { ArrowUpRight, BarChart3 } from "lucide-react";

import {
  dashboardPerformance,
  revenueTrend,
} from "@/utils/dashboard.data";

type Range = "7D" | "30D" | "90D";

const ranges: Range[] = ["7D", "30D", "90D"];

const RevenueOccupancy = () => {
  const [range, setRange] = useState<Range>("7D");

  const maxRevenue = Math.max(
    ...revenueTrend.map((item) => item.value),
  );

  return (
    <section className="relative overflow-hidden bg-[#0C0332] p-6 text-white sm:p-7 lg:p-8">
      <div className="absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#1900FF]/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-[#8D80FF]" />

              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#AAA5C0]">
                Revenue & occupancy
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#AAA5C0]">
                Revenue collected today
              </p>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                  ₵{dashboardPerformance.revenue.today.toLocaleString()}
                </span>

                <span className="flex items-center gap-1 text-[11px] font-bold text-[#8DFFB7]">
                  <ArrowUpRight size={12} />
                  {dashboardPerformance.revenue.comparison}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-[#AAA5C0]">
                {dashboardPerformance.revenue.comparisonLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 self-start border border-white/10 p-1">
            {ranges.map((item) => {
              const active = range === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`px-3 py-1.5 text-[9px] font-bold tracking-wide transition-colors ${
                    active
                      ? "bg-white text-[#0C0332]"
                      : "text-[#AAA5C0] hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="flex items-end gap-2">
              <div className="h-32 flex-1">
                <div className="flex h-full items-end gap-2 sm:gap-3">
                  {revenueTrend.map((item) => {
                    const height =
                      item.value === 0
                        ? 4
                        : Math.max(
                            8,
                            (item.value / maxRevenue) * 100,
                          );

                    const isToday = item.day === "Fri";

                    return (
                      <div
                        key={item.day}
                        className="flex h-full flex-1 flex-col justify-end"
                      >
                        <div className="flex h-full items-end">
                          <div
                            className={`w-full transition-all ${
                              isToday
                                ? "bg-[#1900FF]"
                                : "bg-white/15"
                            }`}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span className="mt-2 text-center text-[9px] font-medium text-[#8A859F]">
                          {item.day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#AAA5C0]">
                Projected revenue
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight">
                ₵
                {dashboardPerformance.revenue.projected.toLocaleString()}
              </p>

              <p className="mt-1 text-[10px] text-[#8A859F]">
                Expected end-of-day
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] text-[#AAA5C0]">
                  Occupancy
                </p>

                <p className="mt-1 text-xl font-bold">
                  {dashboardPerformance.occupancy.value}%
                </p>

                <p className="mt-1 text-[9px] font-bold text-[#8DFFB7]">
                  {dashboardPerformance.occupancy.comparison}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-[#AAA5C0]">
                  Avg. nightly rate
                </p>

                <p className="mt-1 text-xl font-bold">
                  ₵{dashboardPerformance.averageRate}
                </p>

                <p className="mt-1 text-[9px] text-[#8A859F]">
                  Current ADR
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueOccupancy;
