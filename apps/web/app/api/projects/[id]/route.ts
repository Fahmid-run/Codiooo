import { withAuth } from "@/lib/with-auth";
import type { NextRequest } from "next/server";
import { projectServices } from "../../../../modules/project/project.service";
import { apiError, apiResponse, handleApiError } from "@/lib/utils";
import { updateProjectSchema } from "../../../../modules/project/project.schema";

interface Params {
  params: Promise<{ id: string }>;
}

export const GET = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id } = await params;

      const project = await projectServices.getProjectById(id, user.id);

      if (!project) {
        return apiError("Project not found", 404);
      }

      return apiResponse({
        success: true,
        message: "Project Retrieved successfully",
        data: project,
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
      const payload = updateProjectSchema.parse(await request.json());

      const result = await projectServices.updateProject(id, user.id, payload);

      if (result === null) {
        return apiError("Project not found", 404);
      }
      if (result === "forbidden") {
        return apiError("Forbidden", 403);
      }

      return apiResponse({
        success: true,
        message: "Project Updated successfully",
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

      const result = await projectServices.deleteProject(id, user.id);

      if (result === null) {
        return apiError("Project not found", 404);
      }
      if (result === "forbidden") {
        return apiError("Forbidden", 403);
      }

      return apiResponse({
        success: true,
        message: "Project Deleted successfully",
        data: result,
        status: 200,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);
