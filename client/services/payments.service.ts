import operationsApi from "@/actions/operations";
import { getErrorMessage } from "@/lib/errors";

export interface Payment {
  id: string;
  hotelId: string;
  reference: string;
  guestId: string;
  stayId: string;
  invoiceId: string;
  staffId?: string;
  method: "cash" | "mobile_money" | "card" | "bank_transfer";
  amount: string;
  status: "paid" | "partial" | "pending" | "overdue" | "reversed";
  notes?: string;
  createdAt: string;
}



const PaymentsService = () => {
  const getPayments = async (stayId?: string): Promise<Payment[]> => {
    try {
      const response = await operationsApi.getPayments(stayId ? { stayId } : undefined);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch payments:", getErrorMessage(error, "Failed to fetch payments"));
      throw error;
    }
  };

  const getPayment = async (id: string): Promise<Payment> => {
    try {
      const response = await operationsApi.getPayment(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch payment:", getErrorMessage(error, "Failed to fetch payment"));
      throw error;
    }
  };

  const recordPayment = async (data: {
    stayId: string;
    invoiceId: string;
    amount: number;
    method: "cash" | "mobile_money" | "card" | "bank_transfer";
    notes?: string;
  }) => {
    try {
      const response = await operationsApi.recordPayment(data);
      return response.data;
    } catch (error) {
      console.error("Failed to record payment:", getErrorMessage(error, "Failed to record payment"));
      throw error;
    }
  };

  const reversePayment = async (paymentId: string) => {
    try {
      const response = await operationsApi.reversePayment(paymentId);
      return response.data;
    } catch (error) {
      console.error("Failed to reverse payment:", getErrorMessage(error, "Failed to reverse payment"));
      throw error;
    }
  };

  return {
    getPayments,
    getPayment,
    recordPayment,
    reversePayment,
  };
};

export default PaymentsService;
