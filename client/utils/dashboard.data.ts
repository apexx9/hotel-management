export const dashboardPerformance = {
  revenue: { today: 18420, projected: 24500, comparison: "+12.4%", comparisonLabel: "vs yesterday" },
  occupancy: { value: 72, comparison: "+4.8%" },
  averageRate: 214,
};

export const revenueTrend = [
  { day: "Mon", value: 14200 }, { day: "Tue", value: 15100 }, { day: "Wed", value: 13800 },
  { day: "Thu", value: 16500 }, { day: "Fri", value: 18420 }, { day: "Sat", value: 0 }, { day: "Sun", value: 0 },
];

export const roomRevenueByType = [
  { type: "Suite", revenue: 6420, max: 8000 },
  { type: "Deluxe", revenue: 5180, max: 8000 },
  { type: "Standard", revenue: 4300, max: 8000 },
  { type: "Family", revenue: 2520, max: 8000 },
];

export const immediateActions = {
  arrival: { guest: "Eleanor Vance", room: "304", roomType: "Deluxe", time: "14:30" },
  departure: { guest: "Marcus Sterling", room: "212", time: "11:00" },
};

export const needsAttention = [
  { id: 1, type: "urgent", title: "Room 402", description: "Guest arriving in 35m. Housekeeping incomplete.", time: "Now" },
  { id: 2, type: "warning", title: "Reservation #4821", description: "Outstanding payment for 3:00 PM arrival.", time: "15:00" },
];

export const todayArrivals = [
  { id: "A1", guest: "Eleanor Vance", room: "304", type: "Deluxe", time: "14:30", status: "Pending" },
  { id: "A2", guest: "David Chen", room: "412", type: "Suite", time: "15:00", status: "Checked In" },
  { id: "A3", guest: "Sarah Jenkins", room: "208", type: "Standard", time: "16:45", status: "Pending" },
  { id: "A4", guest: "Michael & Lisa Ray", room: "501", type: "Family", time: "18:00", status: "Pending" },
];

export const todayDepartures = [
  { id: "D1", guest: "Marcus Sterling", room: "212", time: "11:00", status: "Pending" },
  { id: "D2", guest: "Priya Patel", room: "305", time: "09:30", status: "Checked Out" },
  { id: "D3", guest: "James Wilson", room: "118", time: "10:15", status: "Checked Out" },
];

export const recentActivity = [
  { id: 1, action: "Check-in completed", target: "David Chen", details: "Room 412", time: "10m ago" },
  { id: 2, action: "Payment received", target: "Invoice #4820", details: "₵4,300 via Credit Card", time: "25m ago" },
  { id: 3, action: "Housekeeping status", target: "Room 304", details: "Marked as Clean", time: "1h ago" },
  { id: 4, action: "Check-out completed", target: "Priya Patel", details: "Room 305", time: "1.5h ago" },
];

export const housekeeping = {
  clean: 42,
  cleaning: 8,
  inspected: 15,
  maintenance: 3,
};

export const arrivals = [
  { guest: "Eleanor Vance", room: "304", roomType: "Deluxe", time: "14:30" },
  { guest: "David Chen", room: "412", roomType: "Suite", time: "15:00" },
  { guest: "Sarah Jenkins", room: "208", roomType: "Standard", time: "16:45" },
  { guest: "Michael & Lisa Ray", room: "501", roomType: "Family", time: "18:00" },
];

export const departures = [
  { guest: "Marcus Sterling", room: "212", time: "11:00" },
  { guest: "Priya Patel", room: "305", time: "09:30" },
  { guest: "James Wilson", room: "118", time: "10:15" },
];

export const revenueByRoomType = [
  { type: "Suite", revenue: 6420, max: 8000, percentage: 80 },
  { type: "Deluxe", revenue: 5180, max: 8000, percentage: 65 },
  { type: "Standard", revenue: 4300, max: 8000, percentage: 54 },
  { type: "Family", revenue: 2520, max: 8000, percentage: 32 },
];
