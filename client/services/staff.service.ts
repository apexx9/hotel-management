import operationsApi from "@/actions/operations";
import { getErrorMessage } from "@/lib/errors";



const StaffService = () => {
  async function getStaff(): Promise<{ staff: any[]; invitations: any[] }> {
    try {
      const response = await operationsApi.getStaff();
      return response.data ?? { staff: [], invitations: [] };
    } catch (error) {
      console.error("Failed to fetch staff:", getErrorMessage(error, "Failed to fetch staff"));
      throw error;
    }
  }

  async function getStaffMember(id: string): Promise<any> {
    try {
      const response = await operationsApi.getStaffMember(id);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch staff member:", getErrorMessage(error, "Failed to fetch staff member"));
      throw error;
    }
  }

  async function inviteStaff(data: { email: string; role: string; fullName?: string }): Promise<any> {
    try {
      const response = await operationsApi.inviteStaff(data);
      return response.data;
    } catch (error) {
      console.error("Failed to invite staff:", getErrorMessage(error, "Failed to invite staff"));
      throw error;
    }
  }

  async function updateStaff(id: string, data: { role?: string; isVerified?: boolean }): Promise<any> {
    try {
      const response = await operationsApi.updateStaff(id, data);
      return response.data;
    } catch (error) {
      console.error("Failed to update staff:", getErrorMessage(error, "Failed to update staff"));
      throw error;
    }
  }

  return {
    getStaff,
    getStaffMember,
    inviteStaff,
    updateStaff,
  };
};

export default StaffService;
