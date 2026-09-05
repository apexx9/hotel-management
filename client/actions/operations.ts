import { instance } from "./api";
import { z } from "zod";
import {
  roomSchema,
  updateRoomSchema,
  updateRoomStatusSchema,
  roomTypeSchema,
  updateRoomTypeSchema,
  guestSchema,
  updateGuestSchema,
  createBookingSchema,
  checkInSchema,
  checkOutSchema,
  recordPaymentSchema,
  serviceSchema,
  updateServiceSchema,
  addServiceChargeSchema,
  createHousekeepingTaskSchema,
  updateHousekeepingSchema,
  inviteStaffSchema,
  updateStaffSchema,
  updateSettingsSchema,
  staysQuerySchema,
  reportsSummaryQuerySchema,
  searchQuerySchema,
} from "../schema/operations.schema";

// Response types (kept as TypeScript types, not Zod, for read operations)

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
  expectedCheckInAt: string | Date;
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
  taxRate: string | number;
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
  createRoom: (data: z.infer<typeof roomSchema>) =>
    instance.post("/rooms", data),
  updateRoom: (id: string, data: z.infer<typeof updateRoomSchema>) =>
    instance.patch(`/rooms/${id}`, data),
  updateRoomStatus: (
    id: string,
    data: z.infer<typeof updateRoomStatusSchema>,
  ) => instance.patch(`/rooms/${id}/status`, data),
  deleteRoom: (id: string) => instance.delete(`/rooms/${id}`),

  // Room Types
  getRoomTypes: () => instance.get("/room-types"),
  getRoomType: (id: string) => instance.get(`/room-types/${id}`),
  createRoomType: (data: z.infer<typeof roomTypeSchema>) =>
    instance.post("/room-types", data),
  updateRoomType: (id: string, data: z.infer<typeof updateRoomTypeSchema>) =>
    instance.patch(`/room-types/${id}`, data),
  deleteRoomType: (id: string) => instance.delete(`/room-types/${id}`),

  // Guests
  getGuests: (params?: z.infer<typeof searchQuerySchema>) =>
    instance.get("/guests", { params }),
  getGuest: (id: string) => instance.get(`/guests/${id}`),
  createGuest: (data: z.infer<typeof guestSchema>) =>
    instance.post("/guests", data),
  updateGuest: (id: string, data: z.infer<typeof updateGuestSchema>) =>
    instance.patch(`/guests/${id}`, data),

  // Stays & Bookings
  getStays: (params?: z.infer<typeof staysQuerySchema>) =>
    instance.get("/stays", { params }),
  getActiveStays: () => instance.get("/stays/active"),
  getArrivals: () => instance.get("/stays/arrivals"),
  getDepartures: () => instance.get("/stays/departures"),
  getStaysByGuest: (guestId: string) => instance.get(`/stays/guest/${guestId}`),
  getStay: (id: string) => instance.get(`/stays/${id}`),
  createBooking: (data: z.infer<typeof createBookingSchema>) =>
    instance.post("/bookings", data),
  checkIn: (data: z.infer<typeof checkInSchema>) =>
    instance.post("/check-in", data),
  checkOut: (data: z.infer<typeof checkOutSchema>) =>
    instance.post("/check-out", data),

  // Invoices
  getInvoices: (params?: { stayId?: string }) =>
    instance.get("/invoices", { params }),
  getInvoice: (id: string) => instance.get(`/invoices/${id}`),
  getInvoiceItems: (id: string) => instance.get(`/invoices/${id}/items`),
  getInvoiceReceipt: (id: string) => instance.get(`/invoices/${id}/receipt`),
  sendInvoiceReceipt: (id: string, data?: { to?: string }) =>
    instance.post(`/invoices/${id}/send-receipt`, data || {}),

  // Payments
  getPayments: (params?: { stayId?: string }) =>
    instance.get("/payments", { params }),
  getPayment: (id: string) => instance.get(`/payments/${id}`),
  recordPayment: (data: z.infer<typeof recordPaymentSchema>) =>
    instance.post("/payments", data),

  // Services & Service Charges
  getServices: () => instance.get("/services"),
  getService: (id: string) => instance.get(`/services/${id}`),
  createService: (data: z.infer<typeof serviceSchema>) =>
    instance.post("/services", data),
  updateService: (id: string, data: z.infer<typeof updateServiceSchema>) =>
    instance.patch(`/services/${id}`, data),
  deleteService: (id: string) => instance.delete(`/services/${id}`),
  getServiceCharges: (params?: { stayId?: string }) =>
    instance.get("/service-charges", { params }),
  addServiceCharge: (data: z.infer<typeof addServiceChargeSchema>) =>
    instance.post("/service-charges", data),

  // Housekeeping
  getHousekeeping: () => instance.get("/housekeeping"),
  getHousekeepingTask: (id: string) => instance.get(`/housekeeping/${id}`),
  createHousekeepingTask: (
    data: z.infer<typeof createHousekeepingTaskSchema>,
  ) => instance.post("/housekeeping", data),
  updateHousekeeping: (data: z.infer<typeof updateHousekeepingSchema>) =>
    instance.patch("/housekeeping", data),

  // Activity & Notifications
  getActivity: () => instance.get("/activity"),
  getActivityLog: (id: string) => instance.get(`/activity/${id}`),
  getNotifications: () => instance.get("/notifications"),
  markNotificationRead: (id: string) =>
    instance.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => instance.post("/notifications/mark-all-read"),

  // Staff
  getStaff: () => instance.get("/staff"),
  getStaffMember: (id: string) => instance.get(`/staff/${id}`),
  inviteStaff: (data: z.infer<typeof inviteStaffSchema>) =>
    instance.post("/staff/invite", data),
  updateStaff: (id: string, data: z.infer<typeof updateStaffSchema>) =>
    instance.patch(`/staff/${id}`, data),

  // Settings
  getSettings: () => instance.get<HotelSettingsResponse>("/settings"),
  updateSettings: (data: z.infer<typeof updateSettingsSchema>) =>
    instance.patch<HotelSettingsResponse>("/settings", data),

  // Reports
  getReportsSummary: (params?: z.infer<typeof reportsSummaryQuerySchema>) =>
    instance.get<ReportsSummaryResponse>("/reports/summary", { params }),
};

export default operationsApi;
