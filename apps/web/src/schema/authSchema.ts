import * as z from "zod";

export const RegisterSchema = z
  .object({
    name: z.string().min(3, "Name must at least 3 characters long!!!"),
    email: z.email("Plz Provide a Valid Email!!"),
    // Aligned with the server (Better Auth minPasswordLength: 8).
    // Complexity rules that the server cannot enforce were removed so
    // the client never rejects a password the server would accept.
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;
