import { NextRequest, NextResponse } from "next/server";
import { apiError, apiResponse } from "@/lib/utils";
import { projectServices } from "../../../modules/project/project.service";
import { getAuthUser } from "@/lib/get-auth-user";
import { withAuth } from "@/lib/with-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return apiError("Unauthorized", 401);
    }
    const projects = await projectServices.getAllProject();

    return apiResponse({
      success: true,
      message: "Projects Retrieved successfully",
      data: projects,
      status: 200,
    });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);

    return apiError(error.message, 500, "Internal Server Error");
  }
}

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const payload = await request.json();
    const project = await projectServices.createProject(payload, user.id);

    return apiResponse({
      success: true,
      message: "Project Created successfully",
      data: project,
      status: 201,
    });
  } catch (error: any) {
    console.error("Failed to create room:", error);
    return apiError(error.message, 500, "Internal Server Error");
  }
});
