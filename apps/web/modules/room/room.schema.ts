import z from "zod";

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Room names must be at least 2 characters.")
    .max(48, "Room names can be up to 48 characters."),
  projectId: z.string().trim().min(1, "Project ID is required."),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Room names must be at least 2 characters.")
      .max(48, "Room names can be up to 48 characters.")
      .optional(),
  })
  .refine((data) => data.name !== undefined, {
    message: "At least one field must be provided.",
  });
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
