import { NextRequest, NextResponse } from "next/server";
import { apiError, apiResponse } from "@/lib/utils";
import { projectServices } from "../../../modules/project/project.service";
import { getAuthUser } from "@/lib/get-auth-user";
import { withAuth } from "@/lib/with-auth";
import { createProjectSchema } from "../../../modules/project/project.schema";
import { ZodError } from "zod";

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

    return apiResponse({
      success: true,
      message: "Project Created successfully",
      data: project,
      status: 201,
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return apiError(JSON.stringify(error.issues), 400, "Validation Error");
    }

    if (error instanceof SyntaxError) {
      return apiError("Invalid JSON body", 400, "Bad Request");
    }
    return apiError(error.message, 500, "Internal Server Error");
  }
});
