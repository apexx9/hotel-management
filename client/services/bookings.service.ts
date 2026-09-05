import operationsApi from "@/actions/operations";

export interface BookingData {
  guestId?: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  nationality?: string;
  identificationType?: string;
  identificationNumber?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  roomId?: string;
  roomTypeId?: string;
  guestsCount: number;
  nights: number;
  expectedCheckInAt: string;
  rate: number;
  discount?: number;
  taxes?: number;
  specialRequests?: string;
  checkInNow?: boolean;
  amountPaid?: number;
  paymentMethod?: string;
}

const BookingsService = () => {
  const createBooking = async (data: BookingData) => {
    const response = await operationsApi.createBooking({
      ...data,
      discount: data.discount ?? 0,
      taxes: data.taxes ?? 0,
      checkInNow: data.checkInNow ?? false,
      amountPaid: data.amountPaid ?? 0,
    });
    return response.data;
  };

  const checkIn = async (data: { stayId: string }) => {
    const response = await operationsApi.checkIn({ stayId: data.stayId });
    return response.data;
  };

  const checkOut = async (data: {
    stayId: string;
    overrideBalance?: boolean;
    amountPaid?: number;
    paymentMethod?: string | null;
  }) => {
    const response = await operationsApi.checkOut({
      stayId: data.stayId,
      overrideBalance: data.overrideBalance ?? false,
      amountPaid: data.amountPaid ?? 0,
      paymentMethod: data.paymentMethod,
    });
    return response.data;
  };

  return {
    createBooking,
    checkIn,
    checkOut,
  };
};

export default BookingsService;
