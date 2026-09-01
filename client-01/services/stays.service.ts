import operationsApi, { DashboardStaySummary } from "@/actions/operations";

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

const StaysService = () => {
  async function getStays(params?: { status?: string; guestId?: string; roomId?: string }): Promise<DashboardStaySummary[]> {
    try {
      const response = await operationsApi.getStays(params);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch stays:", getErrorMessage(error, "Failed to fetch stays"));
      throw error;
    }
  }

  async function getActiveStays(): Promise<DashboardStaySummary[]> {
    try {
      const response = await operationsApi.getActiveStays();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch active stays:", getErrorMessage(error, "Failed to fetch active stays"));
      throw error;
    }
  }

  async function getArrivals(): Promise<DashboardStaySummary[]> {
    try {
      const response = await operationsApi.getArrivals();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch arrivals:", getErrorMessage(error, "Failed to fetch arrivals"));
      throw error;
    }
  }

  async function getDepartures(): Promise<DashboardStaySummary[]> {
    try {
      const response = await operationsApi.getDepartures();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch departures:", getErrorMessage(error, "Failed to fetch departures"));
      throw error;
    }
  }

  async function getStay(id: string): Promise<any> {
    try {
      const response = await operationsApi.getStay(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch stay:", getErrorMessage(error, "Failed to fetch stay"));
      throw error;
    }
  }

  async function getStaysByGuest(guestId: string): Promise<DashboardStaySummary[]> {
    try {
      const response = await operationsApi.getStaysByGuest(guestId);
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch guest stays:", getErrorMessage(error, "Failed to fetch guest stays"));
      throw error;
    }
  }

  return {
    getStays,
    getActiveStays,
    getArrivals,
    getDepartures,
    getStay,
    getStaysByGuest,
  };
};

export default StaysService;
