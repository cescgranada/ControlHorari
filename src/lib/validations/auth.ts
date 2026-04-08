import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Introdueix un email vàlid."),
  password: z.string().min(8, "La contrasenya ha de tenir almenys 8 caràcters.")
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Introdueix un email vàlid.")
});

export const passwordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contrasenya ha de tenir almenys 8 caràcters."),
    confirmPassword: z.string().min(8, "Confirma la contrasenya.")
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Les contrasenyes no coincideixen.",
    path: ["confirmPassword"]
  });

export const breakTypeSchema = z.enum([
  "breakfast",
  "lunch",
  "personal",
  "meeting"
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
export type BreakTypeInput = z.infer<typeof breakTypeSchema>;
