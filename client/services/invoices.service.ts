import operationsApi from "@/actions/operations";

export interface Invoice {
  id: string;
  hotelId: string;
  reference: string;
  guestId: string;
  stayId: string;
  roomId: string;
  status: "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
  subtotal: string;
  discount: string;
  taxes: string;
  total: string;
  amountPaid: string;
  outstanding: string;
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: any[];
  payments?: any[];
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const response = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return response.response?.data?.message || response.message || fallback;
  }
  return fallback;
};

const InvoicesService = () => {
  const getInvoices = async (stayId?: string): Promise<Invoice[]> => {
    try {
      const response = await operationsApi.getInvoices(stayId);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch invoices:", getErrorMessage(error, "Failed to fetch invoices"));
      throw error;
    }
  };

  const getInvoice = async (id: string): Promise<Invoice> => {
    try {
      const response = await operationsApi.getInvoice(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch invoice:", getErrorMessage(error, "Failed to fetch invoice"));
      throw error;
    }
  };

  const getInvoiceItems = async (id: string): Promise<any[]> => {
    try {
      const response = await operationsApi.getInvoiceItems(id);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch invoice items:", getErrorMessage(error, "Failed to fetch invoice items"));
      throw error;
    }
  };

  return {
    getInvoices,
    getInvoice,
    getInvoiceItems,
  };
};

export default InvoicesService;
