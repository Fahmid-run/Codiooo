import type { NextRequest } from "next/server";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { withAuth } from "@/lib/with-auth";
import { createRoomSchema } from "../../../modules/room/room.schema";
import { roomServices } from "../../../modules/room/room.service";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const rooms = await roomServices.getRoomsForUser(user.id);

    return apiResponse({
      success: true,
      message: "Rooms Retrieved successfully",
      data: rooms,
      status: 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const payload = createRoomSchema.parse(await request.json());

    const result = await roomServices.createRoomForUser(payload, user.id);

    if (result === "forbidden") {
      return apiError("Project not found", 404);
    }

    return apiResponse({
      success: true,
      message: "Room Created successfully",
      data: result,
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
