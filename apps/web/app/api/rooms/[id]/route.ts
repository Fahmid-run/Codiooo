import { withAuth } from "@/lib/with-auth";
import type { NextRequest } from "next/server";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { updateRoomSchema } from "../../../../modules/room/room.schema";
import { roomServices } from "../../../../modules/room/room.service";

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id } = await params;

      const room = await roomServices.getRoomByIdForUser(id, user.id);

      if (!room) {
        return apiError("Room not found", 404);
      }

      return apiResponse({
        success: true,
        message: "Room Retrieved successfully",
        data: room,
        status: 200,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const PATCH = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id } = await params;
      const payload = updateRoomSchema.parse(await request.json());

      const result = await roomServices.updateRoomForUser(id, user.id, payload);

      if (result === null) {
        return apiError("Room not found", 404);
      }
      if (result === "forbidden") {
        return apiError("Forbidden", 403);
      }

      return apiResponse({
        success: true,
        message: "Room Updated successfully",
        data: result,
        status: 200,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);

export const DELETE = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id } = await params;

      const result = await roomServices.deleteRoomForUser(id, user.id);

      if (result === null) {
        return apiError("Room not found", 404);
      }
      if (result === "forbidden") {
        return apiError("Forbidden", 403);
      }

      return apiResponse({
        success: true,
        message: "Room Deleted successfully",
        data: result,
        status: 200,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);
