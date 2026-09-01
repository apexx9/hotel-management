import operationsApi, { DashboardSummaryResponse } from "@/actions/operations";

const DashboardService = () => {
  const getSummary = async (): Promise<DashboardSummaryResponse> => {
    const response = await operationsApi.getDashboard();
    return response.data;
  };

  return {
    getSummary,
  };
};

export default DashboardService;

