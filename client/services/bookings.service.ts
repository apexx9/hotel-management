import operationsApi from "@/actions/operations";
import type { UpdateBookingSchema } from "@/schema/operations.schema";
import { getErrorMessage } from "@/lib/errors";

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
  discountMode?: "value" | "percentage";
  taxes?: number;
  taxMode?: "value" | "percentage";
  specialRequests?: string;
  checkInNow?: boolean;
  amountPaid?: number;
  paymentMethod?: string;
}

const BookingsService = () => {
  const createBooking = async (data: BookingData) => {
    try {
      const response = await operationsApi.createBooking({
        ...data,
        discount: data.discount ?? 0,
        discountMode: data.discountMode ?? "value",
        taxes: data.taxes ?? 0,
        taxMode: data.taxMode ?? "value",
        checkInNow: data.checkInNow ?? false,
        amountPaid: data.amountPaid ?? 0,
      });
      return response.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Booking could not be created due to a conflict.",
      );
      throw new Error(message);
    }
  };

  const updateBooking = async (id: string, data: UpdateBookingSchema) => {
    const response = await operationsApi.updateBooking(id, {
      rate: data.rate,
      discount: data.discount,
      taxes: data.taxes,
      notes: data.notes,
      editReason: data.editReason,
    });
    return response.data;
  };

  const cancelBooking = async (id: string) => {
    const response = await operationsApi.cancelBooking(id);
    return response.data;
  };

  const sendConfirmation = async (id: string) => {
    try {
      const response = await operationsApi.sendReservationConfirmation(id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to send reservation confirmation:",
        getErrorMessage(error, "Failed to send confirmation"),
      );
      throw error;
    }
  };

  const transferRoom = async (stayId: string, roomId: string) => {
    const response = await operationsApi.transferRoom(stayId, { roomId });
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

  const getAvailability = async (params: {
    roomTypeId: string;
    checkIn: string;
    nights: number;
    guests: number;
    checkInNow: boolean;
  }) => {
    try {
      const response = await operationsApi.getBookingAvailability(params);
      return response.data;
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Could not check availability for the selected dates.",
      );
      throw new Error(message);
    }
  };

  return {
    createBooking,
    updateBooking,
    cancelBooking,
    sendConfirmation,
    transferRoom,
    checkIn,
    checkOut,
    getAvailability,
  };
};

export default BookingsService;
