import type { DashboardSummaryResponse } from "../../../client/actions/operations";

interface RevenuePanelProps {
  revenue: DashboardSummaryResponse["revenue"];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RevenuePanel({
  revenue,
}: RevenuePanelProps) {
  const maxRevenue = Math.max(
    ...revenue.byRoomType.map((item) => item.revenue),
    1,
  );

  return (
    <section className="border bg-[#0C0332] text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
          Revenue
        </p>

        <h2 className="mt-1 text-sm font-semibold">
          Revenue performance
        </h2>
      </div>

      <div className="grid grid-cols-2 border-b border-white/10">
        <div className="border-r border-white/10 px-5 py-5">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Collected today
          </p>

          <p className="mt-2 text-xl font-semibold tracking-tight">
            {formatCurrency(revenue.today)}
          </p>
        </div>

        <div className="px-5 py-5">
          <p className="text-[10px] uppercase tracking-wider text-white/40">
            Projected
          </p>

          <p className="mt-2 text-xl font-semibold tracking-tight">
            {formatCurrency(revenue.projected)}
          </p>
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="mb-4 text-[10px] uppercase tracking-wider text-white/40">
          Revenue by room type
        </p>

        <div className="space-y-4">
          {revenue.byRoomType.length === 0 ? (
            <p className="text-xs text-white/40">
              No room revenue recorded.
            </p>
          ) : (
            revenue.byRoomType.slice(0, 5).map((item) => (
              <div key={item.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-white/70">
                    {item.type}
                  </span>

                  <span className="text-[11px] font-medium">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>

                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-[#1900FF]"
                    style={{
                      width: `${(item.revenue / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
