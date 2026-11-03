import { NextRequest, NextResponse } from "next/server";
import { apiError, apiResponse } from "@/lib/utils";
import { projectServices } from "../../../modules/project/project.service";
import { getAuthUser } from "@/lib/get-auth-user";
import { withAuth } from "@/lib/with-auth";
import { createProjectSchema } from "../../../modules/project/project.schema";

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

    const validatedData = createProjectSchema.parse(payload);

    const projectOwnerId =
      user?.id ||
      (user as any)?.userId ||
      (user as any)?._id ||
      (user as any)?.sub;
    const project = await projectServices.createProject(
      validatedData,
      projectOwnerId,
    );
    // 👀 ADD THESE LOGS TO YOUR TERMINAL 👀
    console.log("SERVER - Received Payload:", payload);
    console.log("SERVER - Received User Object:", user);
    console.log("SERVER - User ID:", user?.id);
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
