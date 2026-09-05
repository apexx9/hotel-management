import { z } from "zod";

// ---------- Base / Utility Schemas ----------
const optionalString = z.string().trim().optional().nullable();
const dateString = z.string().datetime().or(z.date()).optional().nullable();

// ---------- Room Schema ----------
export const roomSchema = z.object({
  number: z.string().min(1, "Room number is required"),
  floor: z.string().optional().nullable(),
  roomTypeId: z.string().uuid("Invalid room type ID"),
  status: z
    .enum(["available", "occupied", "maintenance", "turning_over"])
    .default("available"),
  notes: z.string().optional().nullable(),
});

export const updateRoomSchema = roomSchema.partial();

export const updateRoomStatusSchema = z.object({
  status: z.enum(["available", "occupied", "maintenance", "turning_over"]),
});

// ---------- Room Type Schema ----------
export const roomTypeSchema = z.object({
  name: z.string().min(1, "Room type name is required"),
  basePrice: z.number().positive("Base price must be positive"),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer")
    .default(1),
  description: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional().nullable(),
});

export const updateRoomTypeSchema = roomTypeSchema.partial();

// ---------- Guest Schema ----------
export const guestSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  identificationType: z.string().optional().nullable(),
  identificationNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateGuestSchema = guestSchema.partial();

// ---------- Booking / Stay Schema ----------
export const createBookingSchema = z.object({
  guestId: z.string().uuid("Invalid guest ID").optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().nullable(),
  nationality: z.string().optional().nullable(),
  identificationType: z.string().optional().nullable(),
  identificationNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  roomId: z.string().uuid("Invalid room ID").optional().nullable(),
  roomTypeId: z.string().uuid("Invalid room type ID").optional().nullable(),
  guestsCount: z.number().int().positive().default(1),
  nights: z.number().int().positive(),
  expectedCheckInAt: z.string().datetime(),
  rate: z.number().nonnegative(),
  discount: z.number().nonnegative().optional().default(0),
  taxes: z.number().nonnegative().optional().default(0),
  specialRequests: z.string().optional().nullable(),
  checkInNow: z.boolean().optional().default(false),
  amountPaid: z.number().nonnegative().optional().default(0),
  paymentMethod: z.string().optional().nullable(),
});

export const checkInSchema = z.object({
  stayId: z.string().uuid("Invalid stay ID"),
});

export const checkOutSchema = z.object({
  stayId: z.string().uuid("Invalid stay ID"),
  overrideBalance: z.boolean().optional().default(false),
  amountPaid: z.number().nonnegative().optional().default(0),
  paymentMethod: z.string().optional().nullable(),
});

// ---------- Payment Schema ----------
export const recordPaymentSchema = z.object({
  stayId: z.string().uuid("Invalid stay ID"),
  invoiceId: z.string().uuid("Invalid invoice ID"),
  amount: z.number().positive("Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
  notes: z.string().optional().nullable(),
});

// ---------- Service Schema ----------
export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().nonnegative("Price must be non-negative"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = serviceSchema.partial();

// ---------- Service Charge Schema ----------
export const addServiceChargeSchema = z.object({
  stayId: z.string().uuid("Invalid stay ID"),
  serviceId: z.string().uuid("Invalid service ID"),
  quantity: z.number().int().positive().default(1),
});

// ---------- Housekeeping Schema ----------
export const createHousekeepingTaskSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  status: z
    .enum(["cleaning", "inspection", "ready", "maintenance"])
    .default("cleaning"),
  note: z.string().optional().nullable(),
});

export const updateHousekeepingSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
  status: z.enum(["cleaning", "inspection", "ready", "maintenance"]),
  note: z.string().optional().nullable(),
});

// ---------- Staff Schema ----------
export const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.string().min(1, "Role is required"),
  fullName: z.string().optional().nullable(),
});

export const updateStaffSchema = z.object({
  role: z.string().optional(),
  isVerified: z.boolean().optional(),
});

// ---------- Settings Schema (Partial for update) ----------
export const settingsSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
  language: z.string().default("en"),
  checkInTime: z.string().default("14:00"),
  checkOutTime: z.string().default("11:00"),
  bookingPolicy: z.string().optional().nullable(),
  guestIdRequired: z.boolean().default(true),
  taxRate: z.number().default(0),
  invoicePrefix: z.string().default("INV-"),
  acceptedPaymentMethods: z.string().optional().nullable(),
  serviceConfig: z.string().optional().nullable(),
  notificationPrefs: z.string().optional().nullable(),
  systemPrefs: z.string().optional().nullable(),
});

export const updateSettingsSchema = settingsSchema.partial();

// ---------- Query Parameter Schemas ----------
export const staysQuerySchema = z.object({
  status: z.string().optional(),
  guestId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

export const resourceIdQuerySchema = z.object({
  stayId: z.string().uuid().optional(),
  guestId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
});

export const reportsSummaryQuerySchema = z.object({
  range: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().optional(),
});

// ---------- Export Inferred Types ----------
export type RoomSchema = z.infer<typeof roomSchema>;
export type UpdateRoomSchema = z.infer<typeof updateRoomSchema>;
export type UpdateRoomStatusSchema = z.infer<typeof updateRoomStatusSchema>;
export type RoomTypeSchema = z.infer<typeof roomTypeSchema>;
export type UpdateRoomTypeSchema = z.infer<typeof updateRoomTypeSchema>;
export type GuestSchema = z.infer<typeof guestSchema>;
export type UpdateGuestSchema = z.infer<typeof updateGuestSchema>;
export type CreateBookingSchema = z.infer<typeof createBookingSchema>;
export type CheckInSchema = z.infer<typeof checkInSchema>;
export type CheckOutSchema = z.infer<typeof checkOutSchema>;
export type RecordPaymentSchema = z.infer<typeof recordPaymentSchema>;
export type ServiceSchema = z.infer<typeof serviceSchema>;
export type UpdateServiceSchema = z.infer<typeof updateServiceSchema>;
export type AddServiceChargeSchema = z.infer<typeof addServiceChargeSchema>;
export type CreateHousekeepingTaskSchema = z.infer<
  typeof createHousekeepingTaskSchema
>;
export type UpdateHousekeepingSchema = z.infer<typeof updateHousekeepingSchema>;
export type InviteStaffSchema = z.infer<typeof inviteStaffSchema>;
export type UpdateStaffSchema = z.infer<typeof updateStaffSchema>;
export type UpdateSettingsSchema = z.infer<typeof updateSettingsSchema>;
