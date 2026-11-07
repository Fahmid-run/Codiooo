import type { NextRequest } from "next/server";
import {
  COLLAB_TOKEN_TTL_SECONDS,
  signCollabToken,
} from "@codiooo/collab-token";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { withAuth } from "@/lib/with-auth";
import { env } from "@/lib/env";
import { roomServices } from "../../../../../modules/room/room.service";

interface Params {
  params: Promise<{ id: string }>;
}
export const GET = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id: roomId } = await params;

      const room = await roomServices.getRoomByIdForUser(roomId, user.id);

      if (!room) {
        return apiError("Room not found", 404);
      }

      const token = await signCollabToken(
        { userId: user.id, roomId: room.id },
        env.COLLAB_TOKEN_SECRET,
      );

      const response = apiResponse({
        success: true,
        message: "Collaboration token issued",
        data: {
          token,
          roomId: room.id,
          expiresIn: COLLAB_TOKEN_TTL_SECONDS,
        },
        status: 200,
      });
      response.headers.set("Cache-Control", "no-store");
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },
);
