import operationsApi, { ReportsSummaryResponse } from "@/actions/operations";
import { getErrorMessage } from "@/lib/errors";



export type ReportsRange = "today" | "7d" | "30d" | "90d" | "custom";

const ReportsService = () => {
  async function getSummary(params?: { range?: ReportsRange; startDate?: string; endDate?: string }): Promise<ReportsSummaryResponse> {
    try {
      const response = await operationsApi.getReportsSummary(params);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch reports summary:", getErrorMessage(error, "Failed to fetch reports summary"));
      throw error;
    }
  }

  return {
    getSummary,
  };
};

export default ReportsService;
