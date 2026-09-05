import operationsApi from "@/actions/operations";

export interface Guest {
  id: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality?: string;
  identificationType?: string;
  identificationNumber?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  stays?: any[];
  invoices?: any[];
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

const GuestsService = () => {
  const getGuests = async (query?: string): Promise<Guest[]> => {
    try {
      const response = await operationsApi.getGuests(query ? { q: query } : undefined);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch guests:", getErrorMessage(error, "Failed to fetch guests"));
      throw error;
    }
  };

  const getGuest = async (id: string): Promise<Guest> => {
    try {
      const response = await operationsApi.getGuest(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch guest:", getErrorMessage(error, "Failed to fetch guest"));
      throw error;
    }
  };

  const createGuest = async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    nationality?: string;
    identificationType?: string;
    identificationNumber?: string;
    address?: string;
    emergencyContact?: string;
    notes?: string;
  }): Promise<Guest> => {
    try {
      const response = await operationsApi.createGuest({
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phone,
        email: data.email ?? null,
        nationality: data.nationality ?? null,
        identificationType: data.identificationType ?? null,
        identificationNumber: data.identificationNumber ?? null,
        address: data.address ?? null,
        emergencyContact: data.emergencyContact ?? null,
        notes: data.notes ?? null,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create guest:", getErrorMessage(error, "Failed to create guest"));
      throw error;
    }
  };

  const updateGuest = async (id: string, data: Partial<Guest>): Promise<Guest> => {
    try {
      const response = await operationsApi.updateGuest(id, data);
      return response.data;
    } catch (error) {
      console.error("Failed to update guest:", getErrorMessage(error, "Failed to update guest"));
      throw error;
    }
  };

  return {
    getGuests,
    getGuest,
    createGuest,
    updateGuest,
  };
};

export default GuestsService;
