import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project names must be at least 2 characters.")
    .max(48, "Project names can be up to 48 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Descriptions must be 280 characters or fewer."),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type WorkspaceSection = "projects" | "rooms" | "profile";
export type ProjectAccent = "amber" | "violet" | "blue";
export type ProjectIcon = "layers" | "layout" | "sparkles";

export type Project = {
  id: string;
  name: string;
  description: string;
  category: string;
  updatedAt: string;
  accent: ProjectAccent;
  icon: ProjectIcon;
};

export const initialProjects: Project[] = [
  {
    id: "lumen-ui",
    name: "Lumen UI",
    description: "A reusable design language for thoughtful product teams.",
    category: "DESIGN SYSTEM",
    updatedAt: "Updated 2 hours ago",
    accent: "violet",
    icon: "layers",
  },
  {
    id: "northstar",
    name: "Northstar",
    description:
      "A quiet workspace for tracking plans, priorities, and momentum.",
    category: "WEB APP",
    updatedAt: "Updated yesterday",
    accent: "blue",
    icon: "layout",
  },
  {
    id: "field-notes",
    name: "Field Notes",
    description:
      "Collect references, small experiments, and ideas worth keeping.",
    category: "EXPERIMENT",
    updatedAt: "Updated 3 days ago",
    accent: "amber",
    icon: "sparkles",
  },
];
