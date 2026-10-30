import { withAuth } from "@/lib/with-auth";
import { NextRequest } from "next/server";
import { projectServices } from "../../../../modules/project/project.service";
import { apiError, apiResponse } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}
export const GET = withAuth(
  async (request: NextRequest, user, { params }: Params) => {
    try {
      const { id } = await params;
      const projects = await projectServices.getProjectById(id);

      return apiResponse({
        success: true,
        message: "Project Retrieved successfully",
        data: projects,
        status: 200,
      });
    } catch (error: any) {
      console.error("Failed to fetch projects:", error);

      return apiError(error.message, 500, "Internal Server Error");
    }
  },
);
