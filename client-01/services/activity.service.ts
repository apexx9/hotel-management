import operationsApi, { DashboardActivityItem } from "@/actions/operations";

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

const ActivityService = () => {
  async function getActivityLogs(): Promise<DashboardActivityItem[]> {
    try {
      const response = await operationsApi.getActivity();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch activity logs:", getErrorMessage(error, "Failed to fetch activity logs"));
      throw error;
    }
  }

  async function getActivityLog(id: string): Promise<DashboardActivityItem> {
    try {
      const response = await operationsApi.getActivityLog(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch activity log:", getErrorMessage(error, "Failed to fetch activity log"));
      throw error;
    }
  }

  return {
    getActivityLogs,
    getActivityLog,
  };
};

export default ActivityService;
