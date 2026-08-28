import operationsApi from "@/actions/operations";

export interface HousekeepingTask {
  id: string;
  hotelId: string;
  roomId: string;
  stayId?: string;
  status: "cleaning" | "inspection" | "ready" | "maintenance";
  assignedToUserId?: string;
  note?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const HousekeepingService = () => {
  const getHousekeepingTasks = async (): Promise<HousekeepingTask[]> => {
    const response = await operationsApi.getHousekeeping();
    return response.data;
  };

  const updateHousekeeping = async (data: {
    roomId: string;
    status: "cleaning" | "inspection" | "ready" | "maintenance";
    note?: string;
  }) => {
    const response = await operationsApi.updateHousekeeping(data);
    return response.data;
  };

  return {
    getHousekeepingTasks,
    updateHousekeeping,
  };
};

export default HousekeepingService;
