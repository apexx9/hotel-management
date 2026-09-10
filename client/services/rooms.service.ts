import operationsApi from "@/actions/operations";
import { getErrorMessage } from "@/lib/errors";

export interface Room {
  id: string;
  hotelId?: string | null;
  number: string;
  floor: string;
  roomTypeId: string;
  status:
    | "available"
    | "occupied"
    | "cleaning"
    | "inspection"
    | "maintenance"
    | "out_of_service"
    | "reserved";
  capacity: number;
  rate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomType {
  id: string;
  hotelId?: string | null;
  name: string;
  description: string | null;
  basePrice: string;
  capacity: number;
  bedConfiguration: string | null;
  amenities: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



const RoomsService = () => {
  const getRooms = async (query?: string): Promise<Room[]> => {
    try {
      const response = await operationsApi.getRooms(
        query ? { q: query } : undefined,
      );
      return response.data ?? [];
    } catch (error) {
      console.error(
        "Failed to fetch rooms:",
        getErrorMessage(error, "Failed to fetch rooms"),
      );
      throw error;
    }
  };

  const getRoom = async (id: string): Promise<Room> => {
    try {
      const response = await operationsApi.getRoom(id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to fetch room:",
        getErrorMessage(error, "Failed to fetch room"),
      );
      throw error;
    }
  };

  const createRoom = async (data: {
    number: string;
    floor: string;
    roomTypeId: string;
    rate?: number;
    capacity?: number;
  }): Promise<Room> => {
    try {
      const response = await operationsApi.createRoom(data);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to create room:",
        getErrorMessage(error, "Failed to create room"),
      );
      throw error;
    }
  };

  const updateRoom = async (id: string, data: Partial<Room>): Promise<Room> => {
    try {
      const { status, ...rest } = data;
      const updateData: Partial<Room> = { ...rest };
      if (status) updateData.status = status;
      const response = await operationsApi.updateRoom(id, updateData);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to update room:",
        getErrorMessage(error, "Failed to update room"),
      );
      throw error;
    }
  };

  const updateRoomStatus = async (
    id: string,
    status: Room["status"],
  ): Promise<Room> => {
    try {
      const response = await operationsApi.updateRoomStatus(id, { status });
      return response.data;
    } catch (error) {
      console.error(
        "Failed to update room status:",
        getErrorMessage(error, "Failed to update room status"),
      );
      throw error;
    }
  };

  const deleteRoom = async (id: string): Promise<{ ok: boolean }> => {
    try {
      const response = await operationsApi.deleteRoom(id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to delete room:",
        getErrorMessage(error, "Failed to delete room"),
      );
      throw error;
    }
  };

  const getRoomTypes = async (): Promise<RoomType[]> => {
    try {
      const response = await operationsApi.getRoomTypes();
      return response.data ?? [];
    } catch (error) {
      console.error(
        "Failed to fetch room types:",
        getErrorMessage(error, "Failed to fetch room types"),
      );
      throw error;
    }
  };

  const getRoomType = async (id: string): Promise<RoomType> => {
    try {
      const response = await operationsApi.getRoomType(id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to fetch room type:",
        getErrorMessage(error, "Failed to fetch room type"),
      );
      throw error;
    }
  };

  const createRoomType = async (data: {
    name: string;
    description?: string;
    basePrice: number;
    capacity: number;
    bedConfiguration?: string;
    amenities?: string | string[] | null;
  }): Promise<RoomType> => {
    try {
      const normalizedAmenities = Array.isArray(data.amenities)
        ? data.amenities.join(", ")
        : typeof data.amenities === "string"
          ? data.amenities
          : (data.amenities ?? undefined);

      const response = await operationsApi.createRoomType({
        ...data,
        amenities: normalizedAmenities,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Failed to create room type:",
        getErrorMessage(error, "Failed to create room type"),
      );
      throw error;
    }
  };

  const updateRoomType = async (
    id: string,
    data: Partial<RoomType>,
  ): Promise<RoomType> => {
    try {
      const { basePrice, amenities, ...rest } = data;
      const updateData: any = { ...rest };
      if (basePrice !== undefined) {
        updateData.basePrice =
          typeof basePrice === "string" ? parseFloat(basePrice) : basePrice;
      }
      if (amenities !== undefined) {
        updateData.amenities = Array.isArray(amenities)
          ? amenities.join(", ")
          : typeof amenities === "string"
            ? amenities
            : (amenities ?? undefined);
      }
      const response = await operationsApi.updateRoomType(id, updateData);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to update room type:",
        getErrorMessage(error, "Failed to update room type"),
      );
      throw error;
    }
  };

  const deleteRoomType = async (id: string): Promise<{ ok: boolean }> => {
    try {
      const response = await operationsApi.deleteRoomType(id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to delete room type:",
        getErrorMessage(error, "Failed to delete room type"),
      );
      throw error;
    }
  };

  return {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    updateRoomStatus,
    deleteRoom,
    getRoomTypes,
    getRoomType,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  };
};

export default RoomsService;
