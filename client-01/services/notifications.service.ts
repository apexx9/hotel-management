import operationsApi from "@/actions/operations";

export interface Notification {
  id: string;
  hotelId: string;
  type: "checkout_overdue" | "payment_outstanding" | "room_ready" | "room_unavailable" | "maintenance_issue" | "new_booking" | "guest_arrival" | "service_charge_added";
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
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

const NotificationsService = () => {
  const getNotifications = async (): Promise<Notification[]> => {
    try {
      const response = await operationsApi.getNotifications();
      return response.data ?? [];
    } catch (error) {
      console.error("Failed to fetch notifications:", getErrorMessage(error, "Failed to fetch notifications"));
      throw error;
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await operationsApi.markNotificationRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", getErrorMessage(error, "Failed to mark notification read"));
      throw error;
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await operationsApi.markAllNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", getErrorMessage(error, "Failed to mark all notifications read"));
      throw error;
    }
  };

  return {
    getNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export default NotificationsService;
