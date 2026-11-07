import { db, or } from "@codiooo/db/src";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.schema";
import { canAccessProject, canModifyProject } from "./access";

export const projectServices = {
  async getAllProject(userId: string) {
    const projects = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    )
      .where((project) =>
        or(
          project.projectOwnerId.eq(userId),
          project.projectMembers.some((member) =>
            member.userId.eq(userId),
          ),
        ),
      )
      .orderBy((project) => project.createdAt.desc())
      .all();

    return projects;
  },

  async getProjectById(projectId: string, userId: string) {
    const project = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    )
      .where((project) =>
        or(
          project.projectOwnerId.eq(userId),
          project.projectMembers.some((member) =>
            member.userId.eq(userId),
          ),
        ),
      )
      .where({ id: projectId })
      .first();

    return project;
  },

  async canAccessProject(projectId: string, userId: string) {
    const project = await db.orm.public.Project.include("projectMembers")
      .where({ id: projectId })
      .first();

    return project ? canAccessProject(project, userId) : false;
  },

  async getAccessibleProjectIds(userId: string) {
    const projects = await db.orm.public.Project.select("id")
      .where((project) =>
        or(
          project.projectOwnerId.eq(userId),
          project.projectMembers.some((member) =>
            member.userId.eq(userId),
          ),
        ),
      )
      .all();

    return projects.map((project) => project.id);
  },

  async createProject(payload: CreateProjectInput, projectOwnerId: string) {
    const { name, description } = payload;

    if (!projectOwnerId) {
      throw new Error("Project owner ID is required");
    }
    const newProject = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    ).create({
      name,
      description,
      projectOwnerId,
    });

    return newProject;
  },

  async updateProject(
    projectId: string,
    userId: string,
    payload: UpdateProjectInput,
  ) {
    const existing = await db.orm.public.Project.include("projectMembers")
      .where({ id: projectId })
      .first();

    if (!existing) return null;
    if (!canModifyProject(existing, userId)) return "forbidden" as const;

    const updated = await db.orm.public.Project.include(
      "projectOwner",
      (owner) => owner.select("id", "name", "email"),
    )
      .where({ id: projectId })
      .update(payload);

    return updated;
  },

  async deleteProject(projectId: string, userId: string) {
    const existing = await db.orm.public.Project.include("projectMembers")
      .where({ id: projectId })
      .first();

    if (!existing) return null;
    if (!canModifyProject(existing, userId)) return "forbidden" as const;

    await db.orm.public.Project.where({ id: projectId }).delete();

    return { id: projectId };
  },
};
