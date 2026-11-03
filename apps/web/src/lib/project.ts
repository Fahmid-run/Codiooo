import { z } from "zod";

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
