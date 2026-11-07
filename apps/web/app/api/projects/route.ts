import type { NextRequest } from "next/server";
import { apiResponse, handleApiError } from "@/lib/utils";
import { projectServices } from "../../../modules/project/project.service";
import { withAuth } from "@/lib/with-auth";
import { createProjectSchema } from "../../../modules/project/project.schema";

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const projects = await projectServices.getAllProject(user.id);

    return apiResponse({
      success: true,
      message: "Projects Retrieved successfully",
      data: projects,
      status: 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const payload = await request.json();

    const validatedData = createProjectSchema.parse(payload);

    const project = await projectServices.createProject(
      validatedData,
      user.id,
    );

    return apiResponse({
      success: true,
      message: "Project Created successfully",
      data: project,
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
