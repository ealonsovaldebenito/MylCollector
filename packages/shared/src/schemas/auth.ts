import { z } from 'zod';

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});
export type Login = z.infer<typeof loginSchema>;

/**
 * Signup schema
 */
export const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  display_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
});
export type Signup = z.infer<typeof signupSchema>;

/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

/**
 * Update password schema
 */
export const updatePasswordSchema = z.object({
  current_password: z.string().min(6),
  new_password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirm_password: z.string().min(6),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});
export type UpdatePassword = z.infer<typeof updatePasswordSchema>;

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  avatar_url: z.string().url().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
});
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

/**
 * User profile
 */
export const userProfileSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string(),
  avatar_url: z.string().url().nullable(),
  bio: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
