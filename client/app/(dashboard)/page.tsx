export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Occupancy</p>
          <p className="text-2xl font-bold">--%</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Available Rooms</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Revenue Today</p>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Arrivals Today</p>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h2 className="text-lg font-medium mb-4">Housekeeping</h2>
          <p className="text-muted-foreground text-sm">No tasks.</p>
        </div>
      </div>
    </div>
  );
}
