import operationsApi, { HotelSettingsResponse } from "@/actions/operations";

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

const SettingsService = () => {
  async function getSettings(): Promise<HotelSettingsResponse> {
    try {
      const response = await operationsApi.getSettings();
      return response.data;
    } catch (error) {
      console.error(
        "Failed to fetch settings:",
        getErrorMessage(error, "Failed to fetch settings"),
      );
      throw error;
    }
  }

  async function updateSettings(
    data: Partial<HotelSettingsResponse>,
  ): Promise<HotelSettingsResponse> {
    try {
      const payload: any = { ...data };
      if (payload.taxRate !== undefined && payload.taxRate !== null) {
        const parsed =
          typeof payload.taxRate === "string"
            ? parseFloat(payload.taxRate)
            : payload.taxRate;
        payload.taxRate = Number.isNaN(parsed) ? 0 : parsed;
      }
      const response = await operationsApi.updateSettings(payload);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to update settings:",
        getErrorMessage(error, "Failed to update settings"),
      );
      throw error;
    }
  }

  return {
    getSettings,
    updateSettings,
  };
};

export default SettingsService;
