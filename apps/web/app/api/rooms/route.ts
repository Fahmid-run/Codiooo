import { NextRequest, NextResponse } from "next/server";
import { db } from "@codiooo/db/src";
import { apiError, apiResponse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const rooms = await db.orm.public.CollaborationRoom.include("project")
      .include("projectOwner", (owner) => owner.select("id", "name", "email"))
      .orderBy((room) => room.createdAt.desc())
      .all();

    return apiResponse({
      success: true,
      message: "Room Retrieved successfully",
      data: rooms,
      status: 200,
    });
  } catch (error: any) {
    console.error("Failed to fetch rooms:", error);

    return apiError(error.message, 500, "Internal Server Error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, projectId, projectOwnerId } = body;

    if (!name || !projectId || !projectOwnerId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Missing required fields: name, projectId, or projectOwnerId",
        },
        { status: 400 },
      );
    }

    const newRoom = await db.orm.public.CollaborationRoom.include(
      "project",
    ).create({
      name,
      projectId,
      projectOwnerId,
    });
    return apiResponse({
      success: true,
      message: "Room Created successfully",
      data: newRoom,
      status: 201,
    });
  } catch (error: any) {
    console.error("Failed to create room:", error);
    return apiError(error.message, 500, "Internal Server Error");
  }
}
