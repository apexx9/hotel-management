import {
  Activity,
  Banknote,
  BedDouble,
  BellRing,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  Hotel,
  LucideIcon,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  LayoutDashboard,
  BarChart3,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type RoomStatus =
  | "available"
  | "occupied"
  | "cleaning"
  | "inspection"
  | "maintenance"
  | "out_of_service";

export type StayStatus =
  | "reserved"
  | "checked_in"
  | "checked_out"
  | "pending_arrival";

export type PaymentStatus =
  | "paid"
  | "partial"
  | "pending"
  | "overdue";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "cancelled";

export type HousekeepingStatus =
  | "cleaning"
  | "inspection"
  | "ready"
  | "maintenance";

/* ============================================================
   NAVIGATION TYPES
============================================================ */

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavigationItem[];
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

/* ============================================================
   ROOM TYPES
============================================================ */

export interface RoomType {
  id: string;
  name: string;
  description: string;
  baseRate: number;
  capacity: number;
  bedConfiguration: string;
  amenities: string[];
  active: boolean;
}

/* ============================================================
   ROOMS
============================================================ */

export interface Room {
  id: string;
  number: string;
  floor: string;
  roomTypeId: string;
  status: RoomStatus;
  capacity: number;
  currentGuest?: string;
  currentStay?: string;
  rate: number;
  updatedAt: string;
}

/* ============================================================
   GUESTS
============================================================ */

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality?: string;
  identificationType?: string;
  identificationNumber?: string;
  address?: string;
  emergencyContact?: string;
  currentStay?: string;
  outstandingBalance: number;
  visits: number;
  notes?: string;
}

/* ============================================================
   STAYS
============================================================ */

export interface Stay {
  id: string;
  reference: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName: string;
  status: StayStatus;
  checkIn: string;
  expectedCheckout: string;
  actualCheckout?: string;
  arrivalTime?: string;
  checkoutTime?: string;
  nights: number;
  guests: number;
  rate: number;
  discount: number;
  taxes: number;
  services: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  notes?: string;
}

/* ============================================================
   PAYMENTS
============================================================ */

export interface Payment {
  id: string;
  reference: string;
  guestName: string;
  stayReference: string;
  invoiceReference: string;
  method:
    | "cash"
    | "mobile money"
    | "card"
    | "bank transfer";
  amount: number;
  status: PaymentStatus;
  staffMember: string;
  timestamp: string;
}

/* ============================================================
   INVOICES
============================================================ */

export interface Invoice {
  id: string;
  reference: string;
  guestName: string;
  stayReference: string;
  roomNumber: string;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  outstanding: number;
  updatedAt: string;
}

/* ============================================================
   SERVICES
============================================================ */

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  active: boolean;
}

/* ============================================================
   STAFF
============================================================ */

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive";
  lastAction: string;
  assignedArea: string;
}

/* ============================================================
   ACTIVITY
============================================================ */

export interface ActivityItem {
  id: string;
  event: string;
  actor: string;
  reference: string;
  timestamp: string;
}

/* ============================================================
   HOUSEKEEPING
============================================================ */

export interface HousekeepingItem {
  id: string;
  roomNumber: string;
  status: HousekeepingStatus;
  assignee: string;
  dueAt: string;
  note: string;
}

/* ============================================================
   DASHBOARD METRICS
============================================================ */

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}

/* ============================================================
   ROOM TYPES DATA
============================================================ */

// MOCK DATA - For development only. Production should use backend APIs
export const mockRoomTypes: RoomType[] = [
  {
    id: "suite",
    name: "Suite",
    description:
      "Premium stay with lounge seating and premium views.",
    baseRate: 760,
    capacity: 3,
    bedConfiguration: "1 king",
    amenities: ["Balcony", "Lounge", "Mini bar"],
    active: true,
  },
  {
    id: "deluxe",
    name: "Deluxe",
    description:
      "Comfortable upgraded room for business or leisure travel.",
    baseRate: 540,
    capacity: 2,
    bedConfiguration: "1 queen",
    amenities: [
      "City view",
      "Work desk",
      "High-speed Wi-Fi",
    ],
    active: true,
  },
  {
    id: "standard",
    name: "Standard",
    description:
      "Efficient stay option for short business and group travel.",
    baseRate: 360,
    capacity: 2,
    bedConfiguration: "1 queen",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "TV",
    ],
    active: true,
  },
  {
    id: "family",
    name: "Family",
    description:
      "Larger room for families or multi-guest stays.",
    baseRate: 680,
    capacity: 4,
    bedConfiguration: "2 queens",
    amenities: [
      "Sofa bed",
      "Extra storage",
      "Dining area",
    ],
    active: true,
  },
];

/* ============================================================
   ROOMS DATA
============================================================ */

export const mockRooms: Room[] = [
  {
    id: "room-101",
    number: "101",
    floor: "1",
    roomTypeId: "standard",
    status: "available",
    capacity: 2,
    rate: 360,
    updatedAt: "2026-08-25T07:20:00Z",
  },
  {
    id: "room-102",
    number: "102",
    floor: "1",
    roomTypeId: "standard",
    status: "occupied",
    capacity: 2,
    currentGuest: "Eleanor Vance",
    currentStay: "ST-2041",
    rate: 360,
    updatedAt: "2026-08-25T08:10:00Z",
  },
  {
    id: "room-203",
    number: "203",
    floor: "2",
    roomTypeId: "deluxe",
    status: "cleaning",
    capacity: 2,
    rate: 540,
    updatedAt: "2026-08-25T09:15:00Z",
  },
  {
    id: "room-204",
    number: "204",
    floor: "2",
    roomTypeId: "deluxe",
    status: "occupied",
    capacity: 2,
    currentGuest: "Marcus Sterling",
    currentStay: "ST-2036",
    rate: 540,
    updatedAt: "2026-08-25T08:35:00Z",
  },
  {
    id: "room-301",
    number: "301",
    floor: "3",
    roomTypeId: "suite",
    status: "maintenance",
    capacity: 3,
    rate: 760,
    updatedAt: "2026-08-25T06:40:00Z",
  },
  {
    id: "room-302",
    number: "302",
    floor: "3",
    roomTypeId: "suite",
    status: "occupied",
    capacity: 3,
    currentGuest: "David Chen",
    currentStay: "ST-2045",
    rate: 760,
    updatedAt: "2026-08-25T09:50:00Z",
  },
  {
    id: "room-401",
    number: "401",
    floor: "4",
    roomTypeId: "family",
    status: "inspection",
    capacity: 4,
    rate: 680,
    updatedAt: "2026-08-25T10:05:00Z",
  },
  {
    id: "room-402",
    number: "402",
    floor: "4",
    roomTypeId: "family",
    status: "out_of_service",
    capacity: 4,
    rate: 680,
    updatedAt: "2026-08-25T05:30:00Z",
  },
];

/* ============================================================
   GUESTS DATA
============================================================ */

export const mockGuests: Guest[] = [
  {
    id: "guest-1",
    firstName: "Eleanor",
    lastName: "Vance",
    phone: "+233 20 555 0131",
    email: "eleanor.vance@example.com",
    nationality: "Ghanaian",
    identificationType: "Passport",
    identificationNumber: "GHA-982134",
    address: "Osu, Accra",
    emergencyContact: "+233 24 111 2200",
    currentStay: "ST-2041",
    outstandingBalance: 120,
    visits: 4,
    notes:
      "Prefers quiet floors and late checkout when available.",
  },
  {
    id: "guest-2",
    firstName: "Marcus",
    lastName: "Sterling",
    phone: "+233 24 555 0188",
    email: "marcus.sterling@example.com",
    nationality: "British",
    identificationType: "Passport",
    identificationNumber: "GBR-512340",
    currentStay: "ST-2036",
    outstandingBalance: 0,
    visits: 2,
    notes: "Corporate traveler.",
  },
  {
    id: "guest-3",
    firstName: "Priya",
    lastName: "Patel",
    phone: "+233 26 404 1404",
    email: "priya.patel@example.com",
    nationality: "Indian",
    identificationType: "National ID",
    identificationNumber: "IND-440221",
    outstandingBalance: 0,
    visits: 5,
  },
  {
    id: "guest-4",
    firstName: "David",
    lastName: "Chen",
    phone: "+233 20 772 2311",
    email: "david.chen@example.com",
    nationality: "Chinese",
    identificationType: "Passport",
    identificationNumber: "CHN-889412",
    currentStay: "ST-2045",
    outstandingBalance: 35,
    visits: 3,
  },
  {
    id: "guest-5",
    firstName: "Michael",
    lastName: "Ray",
    phone: "+233 27 303 3320",
    outstandingBalance: 0,
    visits: 1,
  },
];

/* ============================================================
   STAYS DATA
============================================================ */

export const mockStays: Stay[] = [
  {
    id: "stay-1",
    reference: "ST-2041",
    guestId: "guest-1",
    guestName: "Eleanor Vance",
    roomNumber: "102",
    roomTypeId: "standard",
    roomTypeName: "Standard",
    status: "checked_in",
    checkIn: "2026-08-25T08:15:00Z",
    expectedCheckout: "2026-08-27T11:00:00Z",
    arrivalTime: "14:30",
    nights: 2,
    guests: 1,
    rate: 360,
    discount: 40,
    taxes: 54,
    services: 80,
    amountPaid: 374,
    outstandingBalance: 120,
    paymentStatus: "partial",
  },
  {
    id: "stay-2",
    reference: "ST-2036",
    guestId: "guest-2",
    guestName: "Marcus Sterling",
    roomNumber: "204",
    roomTypeId: "deluxe",
    roomTypeName: "Deluxe",
    status: "checked_in",
    checkIn: "2026-08-24T16:40:00Z",
    expectedCheckout: "2026-08-25T11:00:00Z",
    checkoutTime: "11:00",
    nights: 1,
    guests: 1,
    rate: 540,
    discount: 0,
    taxes: 81,
    services: 0,
    amountPaid: 621,
    outstandingBalance: 0,
    paymentStatus: "paid",
  },
  {
    id: "stay-3",
    reference: "ST-2045",
    guestId: "guest-4",
    guestName: "David Chen",
    roomNumber: "302",
    roomTypeId: "suite",
    roomTypeName: "Suite",
    status: "pending_arrival",
    checkIn: "2026-08-25T15:00:00Z",
    expectedCheckout: "2026-08-28T11:00:00Z",
    arrivalTime: "15:00",
    nights: 3,
    guests: 2,
    rate: 760,
    discount: 60,
    taxes: 105,
    services: 0,
    amountPaid: 700,
    outstandingBalance: 35,
    paymentStatus: "partial",
    specialRequests:
      "Late check-in, extra pillows",
  },
  {
    id: "stay-4",
    reference: "ST-2018",
    guestId: "guest-3",
    guestName: "Priya Patel",
    roomNumber: "305",
    roomTypeId: "suite",
    roomTypeName: "Suite",
    status: "checked_out",
    checkIn: "2026-08-21T13:25:00Z",
    expectedCheckout: "2026-08-24T11:00:00Z",
    actualCheckout: "2026-08-24T10:50:00Z",
    checkoutTime: "10:50",
    nights: 3,
    guests: 1,
    rate: 760,
    discount: 0,
    taxes: 114,
    services: 60,
    amountPaid: 2434,
    outstandingBalance: 0,
    paymentStatus: "paid",
  },
  {
    id: "stay-5",
    reference: "ST-2051",
    guestId: "guest-5",
    guestName: "Michael Ray",
    roomNumber: "401",
    roomTypeId: "family",
    roomTypeName: "Family",
    status: "reserved",
    checkIn: "2026-08-25T18:00:00Z",
    expectedCheckout: "2026-08-27T11:00:00Z",
    arrivalTime: "18:00",
    nights: 2,
    guests: 4,
    rate: 680,
    discount: 0,
    taxes: 0,
    services: 0,
    amountPaid: 0,
    outstandingBalance: 0,
    paymentStatus: "pending",
    notes:
      "Family suite reserved for evening arrival",
  },
];

/* ============================================================
   PAYMENTS DATA
============================================================ */

export const mockPayments: Payment[] = [
  {
    id: "pay-1",
    reference: "PMT-8801",
    guestName: "Marcus Sterling",
    stayReference: "ST-2036",
    invoiceReference: "INV-4403",
    method: "card",
    amount: 621,
    status: "paid",
    staffMember: "Ava Mensah",
    timestamp: "2026-08-25T11:00:00Z",
  },
  {
    id: "pay-2",
    reference: "PMT-8802",
    guestName: "Eleanor Vance",
    stayReference: "ST-2041",
    invoiceReference: "INV-4408",
    method: "mobile money",
    amount: 374,
    status: "partial",
    staffMember: "Kofi Adjei",
    timestamp: "2026-08-25T09:50:00Z",
  },
  {
    id: "pay-3",
    reference: "PMT-8803",
    guestName: "Priya Patel",
    stayReference: "ST-2018",
    invoiceReference: "INV-4396",
    method: "card",
    amount: 2434,
    status: "paid",
    staffMember: "Ava Mensah",
    timestamp: "2026-08-24T10:50:00Z",
  },
  {
    id: "pay-4",
    reference: "PMT-8804",
    guestName: "David Chen",
    stayReference: "ST-2045",
    invoiceReference: "INV-4411",
    method: "cash",
    amount: 700,
    status: "partial",
    staffMember: "Kofi Adjei",
    timestamp: "2026-08-25T12:05:00Z",
  },
];

/* ============================================================
   INVOICES DATA
============================================================ */

export const mockInvoices: Invoice[] = [
  {
    id: "inv-1",
    reference: "INV-4408",
    guestName: "Eleanor Vance",
    stayReference: "ST-2041",
    roomNumber: "102",
    status: "partially_paid",
    total: 494,
    amountPaid: 374,
    outstanding: 120,
    updatedAt: "2026-08-25T09:50:00Z",
  },
  {
    id: "inv-2",
    reference: "INV-4411",
    guestName: "David Chen",
    stayReference: "ST-2045",
    roomNumber: "302",
    status: "issued",
    total: 735,
    amountPaid: 700,
    outstanding: 35,
    updatedAt: "2026-08-25T12:05:00Z",
  },
  {
    id: "inv-3",
    reference: "INV-4403",
    guestName: "Marcus Sterling",
    stayReference: "ST-2036",
    roomNumber: "204",
    status: "paid",
    total: 621,
    amountPaid: 621,
    outstanding: 0,
    updatedAt: "2026-08-25T11:00:00Z",
  },
  {
    id: "inv-4",
    reference: "INV-4396",
    guestName: "Priya Patel",
    stayReference: "ST-2018",
    roomNumber: "305",
    status: "paid",
    total: 2434,
    amountPaid: 2434,
    outstanding: 0,
    updatedAt: "2026-08-24T10:50:00Z",
  },
];

/* ============================================================
   SERVICES DATA
============================================================ */

export const mockServices: ServiceItem[] = [
  {
    id: "svc-1",
    name: "Room Service Breakfast",
    category: "Room service",
    price: 85,
    description:
      "Morning meal delivered to the guest room.",
    active: true,
  },
  {
    id: "svc-2",
    name: "Laundry Pressing",
    category: "Laundry",
    price: 120,
    description:
      "Same-day pressing and laundry turnaround.",
    active: true,
  },
  {
    id: "svc-3",
    name: "Airport Transfer",
    category: "Transport",
    price: 260,
    description:
      "One-way airport transfer with luggage handling.",
    active: true,
  },
  {
    id: "svc-4",
    name: "Mini Bar Refill",
    category: "Bar",
    price: 45,
    description:
      "Restock of minibar items after guest consumption.",
    active: true,
  },
];

/* ============================================================
   STAFF DATA
============================================================ */

export const mockStaffMembers: StaffMember[] = [
  {
    id: "staff-1",
    name: "Ava Mensah",
    role: "Front Desk",
    status: "active",
    lastAction: "Checked in Marcus Sterling",
    assignedArea: "Lobby",
  },
  {
    id: "staff-2",
    name: "Kofi Adjei",
    role: "Finance",
    status: "active",
    lastAction: "Recorded payment PMT-8804",
    assignedArea: "Cash office",
  },
  {
    id: "staff-3",
    name: "Naomi Boateng",
    role: "Housekeeping",
    status: "active",
    lastAction:
      "Moved room 203 to inspection",
    assignedArea: "Floor 2",
  },
  {
    id: "staff-4",
    name: "Daniel Owusu",
    role: "Maintenance",
    status: "active",
    lastAction:
      "Marked room 301 out of service",
    assignedArea: "Engineering",
  },
];

/* ============================================================
   HOUSEKEEPING DATA
============================================================ */

export const mockHousekeepingTasks: HousekeepingItem[] = [
  {
    id: "hk-1",
    roomNumber: "102",
    status: "ready",
    assignee: "Naomi Boateng",
    dueAt: "11:20",
    note:
      "Room cleaned and awaiting recheck.",
  },
  {
    id: "hk-2",
    roomNumber: "203",
    status: "cleaning",
    assignee: "Naomi Boateng",
    dueAt: "12:00",
    note:
      "Priority turnover before 15:00 arrival.",
  },
  {
    id: "hk-3",
    roomNumber: "401",
    status: "inspection",
    assignee: "Ama Serwaa",
    dueAt: "12:45",
    note:
      "Family room requires final walkthrough.",
  },
  {
    id: "hk-4",
    roomNumber: "301",
    status: "maintenance",
    assignee: "Daniel Owusu",
    dueAt: "13:30",
    note:
      "Leak fix pending before saleable status.",
  },
];

/* ============================================================
   ACTIVITY LOG
============================================================ */

export const mockActivityLog: ActivityItem[] = [
  {
    id: "act-1",
    event: "Check-in completed",
    actor: "Ava Mensah",
    reference: "Eleanor Vance · ST-2041",
    timestamp: "10 minutes ago",
  },
  {
    id: "act-2",
    event: "Payment recorded",
    actor: "Kofi Adjei",
    reference: "PMT-8804 · Room 302",
    timestamp: "18 minutes ago",
  },
  {
    id: "act-3",
    event: "Housekeeping updated",
    actor: "Naomi Boateng",
    reference:
      "Room 203 moved to cleaning",
    timestamp: "34 minutes ago",
  },
  {
    id: "act-4",
    event: "Checkout completed",
    actor: "Ava Mensah",
    reference: "Priya Patel · ST-2018",
    timestamp: "1 hour ago",
  },
  {
    id: "act-5",
    event: "Maintenance flagged",
    actor: "Daniel Owusu",
    reference:
      "Room 301 out of service",
    timestamp: "2 hours ago",
  },
];

/* ============================================================
   NOTIFICATIONS
============================================================ */

export const mockNotifications = [
  {
    id: "note-1",
    label: "Checkout overdue",
    detail:
      "Room 204 should have been cleared by 11:00.",
    tone: "critical",
  },
  {
    id: "note-2",
    label: "Outstanding balance",
    detail:
      "Eleanor Vance still owes GHS 120.",
    tone: "warning",
  },
  {
    id: "note-3",
    label: "Room ready",
    detail:
      "Room 102 is clean and ready for assignment.",
    tone: "success",
  },
  {
    id: "note-4",
    label: "Maintenance issue",
    detail:
      "Room 301 remains out of service.",
    tone: "warning",
  },
];

/* ============================================================
   NAVIGATION
============================================================ */

export const navigationSections: NavigationSection[] = [
  {
    label: "Operations",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        label: "Front Desk",
        href: "/front-desk",
        icon: ClipboardList,
        children: [
          {
            label: "Overview",
            href: "/front-desk",
            icon: ClipboardList,
          },
          {
            label: "Walk-in Booking",
            href: "/front-desk/new-booking",
            icon: CalendarClock,
          },
          {
            label: "Check-in",
            href: "/front-desk/check-in",
            icon: CalendarCheck,
          },
          {
            label: "Check-out",
            href: "/front-desk/check-out",
            icon: Hotel,
          },
        ],
      },
    ],
  },

  {
    label: "Property",
    items: [
      {
        label: "Rooms",
        href: "/rooms",
        icon: BedDouble,
      },
      {
        label: "Guests",
        href: "/guests",
        icon: Users,
      },
      {
        label: "Housekeeping",
        href: "/housekeeping",
        icon: BellRing,
      },
      {
        label: "Services",
        href: "/services",
        icon: Sparkles,
      },
    ],
  },

  {
    label: "Finance",
    items: [
      {
        label: "Payments",
        href: "/payments",
        icon: CreditCard,
      },
      {
        label: "Invoices",
        href: "/invoices",
        icon: FileText,
      },
      {
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
      },
    ],
  },

  {
    label: "Administration",
    items: [
      {
        label: "Staff",
        href: "/staff",
        icon: ShieldCheck,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Activity,
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

/* ============================================================
   ROUTE TITLES
============================================================ */

export const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",

  "/front-desk": "Front Desk",
  "/front-desk/new-booking": "Walk-in Booking",
  "/front-desk/check-in": "Check-in",
  "/front-desk/check-out": "Check-out",

  "/guests": "Guests",
  "/rooms": "Rooms",
  "/housekeeping": "Housekeeping",
  "/services": "Services",

  "/payments": "Payments",
  "/invoices": "Invoices",
  "/reports": "Reports",

  "/staff": "Staff",
  "/settings": "Settings",
  "/notifications": "Notifications",
};

/* ============================================================
   ROUTE DESCRIPTIONS
============================================================ */

export const routeDescriptions: Record<string, string> = {
  "/dashboard":
    "Track hotel performance, upcoming arrivals, departures, revenue, and operational exceptions.",

  "/front-desk":
    "Handle live arrivals, departures, room assignments, and urgent front desk tasks.",

  "/front-desk/new-booking":
    "Create a new walk-in stay with guest details, room assignment, and payment capture.",

  "/front-desk/check-in":
    "Verify a stay, confirm room readiness, and complete the check-in sequence.",

  "/front-desk/check-out":
    "Review charges, settle balances, and complete the guest departure process.",

  "/guests":
    "Search guests, review history, and keep guest profiles current for repeat visits.",

  "/rooms":
    "Monitor room status, room types, rates, and maintenance state across the property.",

  "/housekeeping":
    "Coordinate room cleaning, inspection, and readiness across the daily turnover flow.",

  "/services":
    "Manage hotel services and attach service charges to active guest stays.",

  "/payments":
    "Review payments, methods, balances, and payment activity across the hotel.",

  "/invoices":
    "Track invoice status, totals, and settlement progress for each stay.",

  "/staff":
    "Manage hotel staff, roles, and operational activity without changing authentication.",

  "/reports":
    "Review revenue, occupancy, operational, guest, and staff performance trends.",

  "/settings":
    "Adjust hotel configuration, service settings, payment options, and operational preferences.",

  "/notifications":
    "Review operational alerts and attention items across hotel activity.",
};

/* ============================================================
   FORMATTING
============================================================ */

export const formatCurrency = (amount: number) =>
  `₵${amount.toLocaleString("en-GH")}`;

export const formatPercent = (value: number) =>
  `${value.toFixed(1)}%`;

/* ============================================================
   OCCUPANCY
============================================================ */

export const calculateOccupancy = (roomsList: Room[]) => {
  const occupiedRooms = roomsList.filter(
    (room) => room.status === "occupied",
  ).length;

  const totalRooms = roomsList.length;

  const availableRooms = roomsList.filter(
    (room) => room.status === "available",
  ).length;

  return {
    occupiedRooms,
    totalRooms,
    availableRooms,
    occupancy:
      totalRooms === 0
        ? 0
        : (occupiedRooms / totalRooms) * 100,
  };
};

/* ============================================================
   REVENUE BY ROOM TYPE
============================================================ */

export const getRevenueByRoomType = (roomTypesList: RoomType[], staysList: Stay[]) =>
  roomTypesList.map((roomType) => {
    const typeStays = staysList.filter(
      (stay) => stay.roomTypeId === roomType.id,
    );

    const revenue = typeStays.reduce(
      (sum, stay) =>
        sum +
        stay.rate * stay.nights +
        stay.services +
        stay.taxes -
        stay.discount,
      0,
    );

    return {
      type: roomType.name,
      revenue,
      totalRate: roomType.baseRate,
      percentage:
        typeStays.length === 0
          ? 0
          : Math.min(
              100,
              Math.round(
                (revenue /
                  (roomType.baseRate * 5)) *
                  100,
              ),
            ),
    };
  });

/* ============================================================
   DASHBOARD METRICS
============================================================ */

// Note: Dashboard metrics should come from backend API
// This function is kept for reference only
export const getDashboardMetrics = (
  roomsList: Room[],
  paymentsList: Payment[],
  staysList: Stay[],
): DashboardMetric[] => {
  const {
    occupiedRooms,
    totalRooms,
    availableRooms,
    occupancy,
  } = calculateOccupancy(roomsList);

  const revenueCollectedToday =
    paymentsList.reduce(
      (sum, payment) =>
        sum + payment.amount,
      0,
    );

  const projectedEndOfDayRevenue =
    revenueCollectedToday + 1620;

  const averageDailyRate = occupiedRooms
    ? Math.round(
        staysList
          .filter(
            (stay) =>
              stay.status === "checked_in",
          )
          .reduce(
            (sum, stay) =>
              sum + stay.rate,
            0,
          ) / occupiedRooms,
      )
    : 0;

  const revPar = totalRooms
    ? Math.round(
        revenueCollectedToday /
          totalRooms,
      )
    : 0;

  const todayCheckIns = staysList.filter(
    (stay) =>
      stay.status !== "checked_out",
  ).length;

  const todayCheckOuts = staysList.filter(
    (stay) =>
      stay.status === "checked_out" ||
      stay.expectedCheckout.startsWith(
        "2026-08-25",
      ),
  ).length;

    return [
      {
        label: "Occupancy",
        value: formatPercent(occupancy),
        detail: `${occupiedRooms} occupied / ${availableRooms} available`,
        icon: BedDouble,
      },
      {
        label: "Occupied rooms",
        value: occupiedRooms.toString(),
        detail: `${totalRooms} total rooms on property`,
        icon: Hotel,
      },
      {
        label: "Available rooms",
        value: availableRooms.toString(),
        detail:
          "Rooms ready for assignment now",
        icon: CalendarClock,
      },
      {
        label: "Revenue collected today",
        value:
          formatCurrency(
            revenueCollectedToday,
          ),
        detail:
          "Payments captured so far today",
        icon: Banknote,
      },
      {
        label:
          "Projected end-of-day revenue",
        value:
          formatCurrency(
            projectedEndOfDayRevenue,
          ),
        detail:
          "Includes expected remaining balances",
        icon: Sparkles,
      },
      {
        label: "Average Daily Rate",
        value:
          formatCurrency(
            averageDailyRate,
          ),
        detail:
          "Current occupied-room average",
        icon: CreditCard,
      },
      {
        label: "RevPAR",
        value:
          formatCurrency(revPar),
        detail:
          "Revenue per available room",
        icon: FileText,
      },
      {
        label: "Today's check-ins",
        value:
          todayCheckIns.toString(),
        detail:
          "Guests currently arriving or due",
        icon: ClipboardList,
      },
      {
        label: "Today's check-outs",
        value:
          todayCheckOuts.toString(),
        detail:
          "Departures scheduled for today",
        icon: Hotel,
      },
    ];
  };

/* ============================================================
   NEXT ARRIVAL
============================================================ */

// Note: These functions should use backend data in production
export const getNextArrival = (staysList: Stay[]) =>
  staysList
    .filter(
      (stay) =>
        stay.status ===
          "pending_arrival" ||
        stay.status === "reserved",
    )
    .sort((a, b) =>
      a.checkIn.localeCompare(b.checkIn),
    )[0];

/* ============================================================
   NEXT DEPARTURE
============================================================ */

export const getNextDeparture = (staysList: Stay[]) =>
  staysList
    .filter(
      (stay) =>
        stay.status === "checked_in",
    )
    .sort((a, b) =>
      a.expectedCheckout.localeCompare(
        b.expectedCheckout,
      ),
    )[0];

/* ============================================================
   NEEDS ATTENTION
============================================================ */

// This is static mock data - production should derive from backend
export const getNeedsAttention = () => [
  {
    id: "attention-1",
    label: "Overdue checkout",
    detail:
      "Room 204 was due to vacate at 11:00 and still requires closeout.",
    reference:
      "Room 204 · Marcus Sterling",
  },
  {
    id: "attention-2",
    label: "Unpaid balance",
    detail:
      "Eleanor Vance still has GHS 120 outstanding on ST-2041.",
    reference:
      "ST-2041 · Room 102",
  },
  {
    id: "attention-3",
    label: "Room unavailable",
    detail:
      "Room 301 remains under maintenance and should not be assigned.",
    reference:
      "Room 301 · Maintenance",
  },
  {
    id: "attention-4",
    label: "Housekeeping delay",
    detail:
      "Room 401 is still awaiting inspection before being sold again.",
    reference:
      "Room 401 · Inspection",
  },
];
