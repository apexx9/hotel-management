// utils/nav-items.ts
import {
  LayoutDashboard,
  BedDouble,
  Users,
  DoorOpen,
  Sparkles,
  Wallet,
  Settings,
  UserPlus,
  UserMinus,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    href: '/front-desk',
    label: 'Front Desk',
    icon: BedDouble,
    children: [
      { href: '/front-desk', label: 'Overview', icon: LayoutDashboard },
      { href: '/front-desk/arrivals', label: 'Arrivals', icon: UserPlus },
      { href: '/front-desk/departures', label: 'Departures', icon: UserMinus },
      { href: '/front-desk/room-status', label: 'Room Status', icon: DoorOpen },
    ],
  },
  { href: '/reservations', label: 'Reservations', icon: CalendarClock },
  { href: '/guests', label: 'Guests', icon: Users },
  {
    href: '/rooms',
    label: 'Rooms',
    icon: DoorOpen,
    children: [
      { href: '/rooms', label: 'Overview', icon: LayoutDashboard },
      { href: '/rooms/grid', label: 'Room Grid', icon: DoorOpen },
      { href: '/rooms/types', label: 'Room Types', icon: BedDouble },
    ],
  },
  { href: '/housekeeping', label: 'Housekeeping', icon: Sparkles },
  {
    href: '/finance',
    label: 'Finance',
    icon: Wallet,
    children: [
      { href: '/finance', label: 'Overview', icon: LayoutDashboard },
      { href: '/finance/invoices', label: 'Invoices', icon: Wallet },
      { href: '/finance/payments', label: 'Payments', icon: Wallet },
      { href: '/finance/services', label: 'Services', icon: Sparkles },
      { href: '/finance/reports', label: 'Reports', icon: LayoutDashboard },
    ],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/settings', label: 'Overview', icon: LayoutDashboard },
      { href: '/settings/hotel', label: 'Hotel Settings', icon: Settings },
      { href: '/settings/staff', label: 'Staff', icon: Users },
      { href: '/settings/notifications', label: 'Notifications', icon: Sparkles },
    ],
  },
];
