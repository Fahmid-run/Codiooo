import z from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project names must be at least 2 characters.")
    .max(48, "Project names can be up to 48 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Descriptions must be 280 characters or fewer.")
    .optional()
    .default(""),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project names must be at least 2 characters.")
      .max(48, "Project names can be up to 48 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(280, "Descriptions must be 280 characters or fewer.")
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided.",
  });
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
