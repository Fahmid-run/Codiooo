import { NextRequest, NextResponse } from "next/server";
import { db } from "@codiooo/db/src";
import { apiError, apiResponse } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Bad Request", message: "Room ID is required" },
        { status: 400 },
      );
    }

    const room = await db.orm.public.CollaborationRoom.include("project")
      .include("projectOwner", (user) => {
        user.select("id", "name", "email");
      })
      .first({ id });

    if (!room) {
      return apiError(`Room with ID '${id}' not found.`, 404, "Not Found");
    }

    return apiResponse({
      success: true,
      message: "Room Retrieved successfully",
      data: room,
      status: 200,
    });
  } catch (error: any) {
    console.error("Failed to fetch room:", error);
    return apiError(error.message, 500, "Internal Server Error");
  }
}
