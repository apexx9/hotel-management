import operationsApi, { HotelSettingsResponse } from "@/actions/operations";
import { getErrorMessage } from "@/lib/errors";



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
      for (const key of ["defaultTaxValue", "defaultDiscountValue"] as const) {
        if (payload[key] !== undefined && payload[key] !== null) {
          const parsed =
            typeof payload[key] === "string"
              ? parseFloat(payload[key])
              : payload[key];
          payload[key] = Number.isNaN(parsed) ? 0 : parsed;
        }
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
