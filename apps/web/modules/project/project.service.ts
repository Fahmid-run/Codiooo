import { apiError } from "@/lib/utils";
import { db } from "@codiooo/db/src";

export const projectServices = {
  async getAllProject() {
    const projects = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    )
      .orderBy((project) => project.createdAt.desc())
      .all();

    return projects;
  },
  async getProjectById(projectId: string) {
    const project = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    ).where({
      id: projectId,
    });

    return project;
  },
  async createProject(payload: any, projectOwnerId: string) {
    const { name, description } = payload;

    if (!name || !description || !projectOwnerId) {
      return apiError(
        "Missing required fields: name, projectId, or projectOwnerId",
        400,
        "Bad Request",
      );
    }
    const newProject = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => {
        owner.select("id", "name", "email");
      },
    ).create({
      name,
      description,
    });

    return newProject;
  },
};
