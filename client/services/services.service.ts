import operationsApi from "@/actions/operations";

export interface Service {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  price: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

const ServicesService = () => {
  const getServices = async (): Promise<Service[]> => {
    try {
      const response = await operationsApi.getServices();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch services:", getErrorMessage(error, "Failed to fetch services"));
      throw error;
    }
  };

  const getService = async (id: string): Promise<Service> => {
    try {
      const response = await operationsApi.getService(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch service:", getErrorMessage(error, "Failed to fetch service"));
      throw error;
    }
  };

  const createService = async (data: {
    name: string;
    category: string;
    price: number;
    description?: string;
    isActive?: boolean;
  }): Promise<Service> => {
    try {
      const response = await operationsApi.createService({
        name: data.name,
        price: data.price,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      });
      return response.data;
    } catch (error) {
      console.error("Failed to create service:", getErrorMessage(error, "Failed to create service"));
      throw error;
    }
  };

  const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
    try {
      const { price, ...rest } = data;
      const updateData: any = { ...rest };
      if (price !== undefined) {
        updateData.price = typeof price === 'string' ? parseFloat(price) : price;
      }
      const response = await operationsApi.updateService(id, updateData);
      return response.data;
    } catch (error) {
      console.error("Failed to update service:", getErrorMessage(error, "Failed to update service"));
      throw error;
    }
  };

  const deleteService = async (id: string): Promise<{ ok: boolean }> => {
    try {
      const response = await operationsApi.deleteService(id);
      return response.data;
    } catch (error) {
      console.error("Failed to delete service:", getErrorMessage(error, "Failed to delete service"));
      throw error;
    }
  };

  const getServiceCharges = async (stayId?: string): Promise<any[]> => {
    try {
      const response = await operationsApi.getServiceCharges(stayId ? { stayId } : undefined);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch service charges:", getErrorMessage(error, "Failed to fetch service charges"));
      throw error;
    }
  };

  const addServiceCharge = async (data: {
    stayId: string;
    serviceId: string;
    quantity: number;
  }) => {
    try {
      const response = await operationsApi.addServiceCharge(data);
      return response.data;
    } catch (error) {
      console.error("Failed to add service charge:", getErrorMessage(error, "Failed to add service charge"));
      throw error;
    }
  };

  return {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
    getServiceCharges,
    addServiceCharge,
  };
};

export default ServicesService;
