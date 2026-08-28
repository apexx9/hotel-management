import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsUUID()
  @IsNotEmpty()
  roomTypeId: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsUUID()
  roomTypeId?: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsIn([
    'available',
    'occupied',
    'cleaning',
    'inspection',
    'maintenance',
    'out_of_service',
    'reserved',
  ])
  status?: string;
}

export class UpdateRoomStatusDto {
  @IsIn([
    'available',
    'occupied',
    'cleaning',
    'inspection',
    'maintenance',
    'out_of_service',
    'reserved',
  ])
  status:
    | 'available'
    | 'occupied'
    | 'cleaning'
    | 'inspection'
    | 'maintenance'
    | 'out_of_service'
    | 'reserved';
}

export class CreateRoomTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  basePrice: number;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsString()
  bedConfiguration?: string;

  @IsOptional()
  @IsString()
  amenities?: string;
}

export class UpdateRoomTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  bedConfiguration?: string;

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGuestDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBookingDto {
  @IsOptional()
  @IsUUID()
  guestId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  identificationType?: string;

  @IsOptional()
  @IsString()
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  roomTypeId?: string;

  @IsInt()
  @Min(1)
  guestsCount: number;

  @IsInt()
  @Min(1)
  nights: number;

  @IsNumber()
  rate: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  taxes?: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsBoolean()
  checkInNow?: boolean;

  @IsOptional()
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class CheckInDto {
  @IsUUID()
  stayId: string;
}

export class CheckOutDto {
  @IsUUID()
  stayId: string;

  @IsOptional()
  @IsBoolean()
  overrideBalance?: boolean;

  @IsOptional()
  @IsNumber()
  amountPaid?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export class CreatePaymentDto {
  @IsUUID()
  stayId: string;

  @IsUUID()
  invoiceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsIn(['cash', 'mobile_money', 'card', 'bank_transfer'])
  method: 'cash' | 'mobile_money' | 'card' | 'bank_transfer';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateServiceChargeDto {
  @IsUUID()
  stayId: string;

  @IsUUID()
  serviceId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateHousekeepingDto {
  @IsUUID()
  roomId: string;

  @IsIn(['cleaning', 'inspection', 'ready', 'maintenance'])
  status: 'cleaning' | 'inspection' | 'ready' | 'maintenance';

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateHousekeepingTaskDto {
  @IsUUID()
  roomId: string;

  @IsOptional()
  @IsUUID()
  stayId?: string;

  @IsOptional()
  @IsIn(['cleaning', 'inspection', 'ready', 'maintenance'])
  status?: 'cleaning' | 'inspection' | 'ready' | 'maintenance';

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  dueAt?: string;
}

export class InviteStaffDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['admin', 'manager', 'front_desk', 'housekeeping', 'finance', 'staff', 'owner'])
  role: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'manager', 'front_desk', 'housekeeping', 'finance', 'staff', 'owner'])
  role?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  bookingPolicy?: string;

  @IsOptional()
  @IsBoolean()
  guestIdRequired?: boolean;

  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @IsOptional()
  @IsString()
  invoicePrefix?: string;

  @IsOptional()
  @IsString()
  acceptedPaymentMethods?: string;

  @IsOptional()
  @IsString()
  serviceConfig?: string;

  @IsOptional()
  @IsString()
  notificationPrefs?: string;

  @IsOptional()
  @IsString()
  systemPrefs?: string;
}

export class QueryReportsDto {
  @IsOptional()
  @IsIn(['today', '7d', '30d', '90d', 'custom'])
  range?: 'today' | '7d' | '30d' | '90d' | 'custom';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
