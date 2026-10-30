import { z } from "zod";
import { APP_CONFIG } from "@/config/constants";

export const passwordRule = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[A-Za-z]/, "Password must contain at least one letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

export const facultyCodeRule = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => APP_CONFIG.facultyIdPattern.test(val), {
    message:
      "Faculty ID must be 4 to 20 uppercase letters, numbers, or hyphens.",
  });

export const registerSchema = z
  .object({
    facultyCode: facultyCodeRule,
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(120, "Full name cannot exceed 120 characters."),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address.")
      .max(150)
      .transform((v) => v.toLowerCase()),
    department: z
      .string()
      .trim()
      .min(2, "Department is required.")
      .max(100, "Department cannot exceed 100 characters."),
    password: passwordRule,
    confirmPassword: z.string().optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.confirmPassword === undefined ||
      data.password === data.confirmPassword,
    {
      message: "Passwords do not match.",
      path: ["confirmPassword"],
    }
  );

export const loginSchema = z
  .object({
    facultyCode: z.string().trim().min(1, "Faculty ID is required."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters.")
      .max(120, "Full name cannot exceed 120 characters.")
      .optional(),
    email: z
      .string()
      .trim()
      .email("Please enter a valid email address.")
      .max(150)
      .transform((v) => v.toLowerCase())
      .optional(),
    department: z
      .string()
      .trim()
      .min(2, "Department must be at least 2 characters.")
      .max(100, "Department cannot exceed 100 characters.")
      .optional(),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordRule,
  })
  .strict();

export const deleteAccountSchema = z
  .object({
    confirmFacultyCode: z.string().trim().min(1, "Confirmation is required."),
  })
  .strict();
