import { instance } from "./api";

export type DashboardSummaryResponse = {
  dashboardStats: {
    occupancy: number;
    occupiedRooms: number;
    availableRooms: number;
    totalRooms: number;
    revenueCollectedToday: number;
    projectedEndOfDayRevenue: number;
    averageDailyRate: number;
    revPar: number;
    todayCheckIns: number;
    todayCheckOuts: number;
  };
  arrivals: DashboardStaySummary[];
  departures: DashboardStaySummary[];
  roomStatus: {
    available: number;
    occupied: number;
    total: number;
    occupancy: number;
    turningOver: number;
    checkInsRemaining: number;
    averageNightlyRate: number;
  };
  revenue: {
    today: number;
    projected: number;
    byRoomType: { id: string; type: string; revenue: number }[];
  };
  housekeeping: {
    cleaning: number;
    inspection: number;
    ready: number;
    maintenance: number;
  };
  attentionItems: {
    id: string;
    type: string;
    title: string;
    description: string;
  }[];
  recentActivity: DashboardActivityItem[];
  nextArrival?: DashboardStaySummary;
  nextDeparture?: DashboardStaySummary;
};

export type DashboardStaySummary = {
  id: string;
  reference: string;
  guestId: string;
  roomId: string;
  roomNumber?: string | null;
  roomFloor?: string | null;
  roomTypeId: string;
  roomTypeName?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  status: string;
  checkInAt: string | Date | null;
  expectedCheckoutAt: string | Date;
  actualCheckoutAt: string | Date | null;
  guestsCount: number;
  nights: number;
  rate: string | number;
  discount: string | number;
  taxes: string | number;
  serviceTotal: string | number;
  total: string | number;
  amountPaid: string | number;
  outstandingBalance: string | number;
  specialRequests?: string | null;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type DashboardActivityItem = {
  id: string;
  actorName: string | null;
  event: string;
  description: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string | Date;
};

export type ReportsSummaryResponse = {
  range: string;
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    occupancyRate: number;
  };
  revenue: {
    totalRevenue: number;
    roomRevenue: number;
    serviceRevenue: number;
    outstandingBalance: number;
  };
  bookings: {
    totalBookings: number;
    activeStays: number;
    completedStays: number;
    cancelledStays: number;
  };
  guests: {
    totalGuests: number;
    newGuests: number;
  };
  housekeeping: {
    cleaning: number;
    inspection: number;
    ready: number;
    maintenance: number;
  };
  dailyTrends: {
    date: string;
    label: string;
    revenue: number;
    occupancy: number;
  }[];
  roomTypeRevenue: {
    id: string;
    name: string;
    revenue: number;
    bookingsCount: number;
  }[];
};

export type HotelSettingsResponse = {
  id: string;
  hotelId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  language: string;
  checkInTime: string;
  checkOutTime: string;
  bookingPolicy: string | null;
  guestIdRequired: boolean;
  taxRate: string;
  invoicePrefix: string;
  acceptedPaymentMethods: string | null;
  serviceConfig: string | null;
  notificationPrefs: string | null;
  systemPrefs: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

const operationsApi = {
  // Dashboard
  getDashboard: () => instance.get<DashboardSummaryResponse>("/dashboard"),

  // Rooms
  getRooms: () => instance.get("/rooms"),
  getRoom: (id: string) => instance.get(`/rooms/${id}`),
  createRoom: (data: any) => instance.post("/rooms", data),
  updateRoom: (id: string, data: any) => instance.patch(`/rooms/${id}`, data),
  updateRoomStatus: (id: string, status: string) =>
    instance.patch(`/rooms/${id}/status`, { status }),
  deleteRoom: (id: string) => instance.delete(`/rooms/${id}`),

  // Room Types
  getRoomTypes: () => instance.get("/room-types"),
  getRoomType: (id: string) => instance.get(`/room-types/${id}`),
  createRoomType: (data: any) => instance.post("/room-types", data),
  updateRoomType: (id: string, data: any) =>
    instance.patch(`/room-types/${id}`, data),
  deleteRoomType: (id: string) => instance.delete(`/room-types/${id}`),

  // Guests
  getGuests: (q?: string) =>
    instance.get("/guests", { params: q ? { q } : undefined }),
  getGuest: (id: string) => instance.get(`/guests/${id}`),
  createGuest: (data: any) => instance.post("/guests", data),
  updateGuest: (id: string, data: any) => instance.patch(`/guests/${id}`, data),

  // Stays & Bookings
  getStays: (params?: { status?: string; guestId?: string; roomId?: string }) =>
    instance.get<DashboardStaySummary[]>("/stays", { params }),
  getActiveStays: () =>
    instance.get<DashboardStaySummary[]>("/stays/active"),
  getArrivals: () =>
    instance.get<DashboardStaySummary[]>("/stays/arrivals"),
  getDepartures: () =>
    instance.get<DashboardStaySummary[]>("/stays/departures"),
  getStaysByGuest: (guestId: string) =>
    instance.get<DashboardStaySummary[]>(`/stays/guest/${guestId}`),
  getStay: (id: string) => instance.get(`/stays/${id}`),
  createBooking: (data: any) => instance.post("/bookings", data),
  checkIn: (data: { stayId: string }) => instance.post("/check-in", data),
  checkOut: (data: {
    stayId: string;
    overrideBalance?: boolean;
    amountPaid?: number;
    paymentMethod?: string;
  }) => instance.post("/check-out", data),

  // Invoices
  getInvoices: (stayId?: string) =>
    instance.get("/invoices", { params: stayId ? { stayId } : undefined }),
  getInvoice: (id: string) => instance.get(`/invoices/${id}`),
  getInvoiceItems: (id: string) => instance.get(`/invoices/${id}/items`),

  // Payments
  getPayments: (stayId?: string) =>
    instance.get("/payments", { params: stayId ? { stayId } : undefined }),
  getPayment: (id: string) => instance.get(`/payments/${id}`),
  recordPayment: (data: {
    stayId: string;
    invoiceId: string;
    amount: number;
    method: string;
    notes?: string;
  }) => instance.post("/payments", data),

  // Services & Service Charges
  getServices: () => instance.get("/services"),
  getService: (id: string) => instance.get(`/services/${id}`),
  createService: (data: any) => instance.post("/services", data),
  updateService: (id: string, data: any) =>
    instance.patch(`/services/${id}`, data),
  deleteService: (id: string) => instance.delete(`/services/${id}`),
  getServiceCharges: (stayId?: string) =>
    instance.get("/service-charges", {
      params: stayId ? { stayId } : undefined,
    }),
  addServiceCharge: (data: {
    stayId: string;
    serviceId: string;
    quantity: number;
  }) => instance.post("/service-charges", data),

  // Housekeeping
  getHousekeeping: () => instance.get("/housekeeping"),
  getHousekeepingTask: (id: string) => instance.get(`/housekeeping/${id}`),
  createHousekeepingTask: (data: any) => instance.post("/housekeeping", data),
  updateHousekeeping: (data: {
    roomId: string;
    status: string;
    note?: string;
  }) => instance.patch("/housekeeping", data),

  // Activity & Notifications
  getActivity: () => instance.get<DashboardActivityItem[]>("/activity"),
  getActivityLog: (id: string) => instance.get(`/activity/${id}`),
  getNotifications: () => instance.get("/notifications"),
  markNotificationRead: (id: string) =>
    instance.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => instance.post("/notifications/mark-all-read"),

  // Staff
  getStaff: () => instance.get("/staff"),
  getStaffMember: (id: string) => instance.get(`/staff/${id}`),
  inviteStaff: (data: { email: string; role: string; fullName?: string }) =>
    instance.post("/staff/invite", data),
  updateStaff: (id: string, data: { role?: string; isVerified?: boolean }) =>
    instance.patch(`/staff/${id}`, data),

  // Settings
  getSettings: () => instance.get<HotelSettingsResponse>("/settings"),
  updateSettings: (data: Partial<HotelSettingsResponse>) =>
    instance.patch<HotelSettingsResponse>("/settings", data),

  // Reports
  getReportsSummary: (params?: { range?: string; startDate?: string; endDate?: string }) =>
    instance.get<ReportsSummaryResponse>("/reports/summary", { params }),
};

export default operationsApi;
