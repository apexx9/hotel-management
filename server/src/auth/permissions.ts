export type CanonicalRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT'
  | 'HOUSEKEEPING'
  | 'SERVICE'
  | 'STAFF';

const ROLE_ALIASES: Record<string, CanonicalRole> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  manager: 'MANAGER',
  front_desk: 'RECEPTIONIST',
  receptionist: 'RECEPTIONIST',
  finance: 'ACCOUNTANT',
  accountant: 'ACCOUNTANT',
  housekeeping: 'HOUSEKEEPING',
  service: 'SERVICE',
  staff: 'STAFF',
};

export function normalizeRole(role: string | undefined | null): CanonicalRole {
  const key = (role ?? '').trim().toLowerCase();
  return ROLE_ALIASES[key] ?? 'STAFF';
}

export const PERMISSIONS = {
  roomsRead: 'rooms.read',
  roomsCreate: 'rooms.create',
  roomsUpdate: 'rooms.update',
  roomsDelete: 'rooms.delete',
  roomsStatus: 'rooms.status',
  roomsBulk: 'rooms.bulk',
  roomTypesCreate: 'room-types.create',
  roomTypesUpdate: 'room-types.update',
  roomTypesDelete: 'room-types.delete',
  guestsCreate: 'guests.create',
  guestsUpdate: 'guests.update',
  reservationsRead: 'reservations.read',
  reservationsCreate: 'reservations.create',
  reservationsUpdate: 'reservations.update',
  reservationsCancel: 'reservations.cancel',
  checkinsCreate: 'checkins.create',
  checkoutsCreate: 'checkouts.create',
  checkoutsOverrideBalance: 'checkouts.override-balance',
  transfersManage: 'transfers.manage',
  paymentsCreate: 'payments.create',
  paymentsReverse: 'payments.reverse',
  invoicesView: 'invoices.view',
  invoicesSend: 'invoices.send',
  servicesManage: 'services.manage',
  chargesCreate: 'charges.create',
  housekeepingCreate: 'housekeeping.create',
  housekeepingUpdate: 'housekeeping.update',
  staffRead: 'staff.read',
  staffCreate: 'staff.create',
  staffUpdate: 'staff.update',
  staffInvite: 'staff.invite',
  settingsUpdate: 'settings.update',
  reportsView: 'reports.view',
  statsView: 'stats.view',
} as const;

export const ALL_PERMISSIONS = '*';

export const PERMISSIONS_BY_ROLE: Record<CanonicalRole, string[]> = {
  OWNER: [ALL_PERMISSIONS],
  ADMIN: [ALL_PERMISSIONS],
  MANAGER: [ALL_PERMISSIONS],
  RECEPTIONIST: [
    PERMISSIONS.roomsRead,
    PERMISSIONS.roomsUpdate,
    PERMISSIONS.roomsStatus,
    PERMISSIONS.guestsCreate,
    PERMISSIONS.guestsUpdate,
    PERMISSIONS.reservationsRead,
    PERMISSIONS.reservationsCreate,
    PERMISSIONS.reservationsUpdate,
    PERMISSIONS.reservationsCancel,
    PERMISSIONS.checkinsCreate,
    PERMISSIONS.checkoutsCreate,
    PERMISSIONS.transfersManage,
    PERMISSIONS.paymentsCreate,
    PERMISSIONS.chargesCreate,
    PERMISSIONS.invoicesView,
    PERMISSIONS.invoicesSend,
    PERMISSIONS.statsView,
  ],
  ACCOUNTANT: [
    PERMISSIONS.roomsRead,
    PERMISSIONS.reservationsRead,
    PERMISSIONS.reservationsUpdate,
    PERMISSIONS.checkoutsCreate,
    PERMISSIONS.checkoutsOverrideBalance,
    PERMISSIONS.paymentsCreate,
    PERMISSIONS.paymentsReverse,
    PERMISSIONS.invoicesView,
    PERMISSIONS.invoicesSend,
    PERMISSIONS.reportsView,
    PERMISSIONS.statsView,
  ],
  HOUSEKEEPING: [
    PERMISSIONS.roomsRead,
    PERMISSIONS.roomsStatus,
    PERMISSIONS.housekeepingCreate,
    PERMISSIONS.housekeepingUpdate,
    PERMISSIONS.statsView,
  ],
  SERVICE: [
    PERMISSIONS.roomsRead,
    PERMISSIONS.chargesCreate,
    PERMISSIONS.statsView,
  ],
  STAFF: [
    PERMISSIONS.roomsRead,
    PERMISSIONS.reservationsRead,
    PERMISSIONS.statsView,
  ],
};

export function hasPermissions(
  role: string | undefined | null,
  required: string[],
): boolean {
  if (!required || required.length === 0) {
    return true;
  }

  const granted = PERMISSIONS_BY_ROLE[normalizeRole(role)] ?? [];
  return required.every(
    (permission) =>
      granted.includes(ALL_PERMISSIONS) || granted.includes(permission),
  );
}
