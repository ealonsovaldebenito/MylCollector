import type { SupabaseClient as Client } from '@supabase/supabase-js';
import type { Login, Signup, UpdateProfile, UserProfile } from '@myl/shared';
import { AppError } from '../api/errors';

/**
 * Sign up a new user
 */
export async function signUp(supabase: Client, data: Signup) {
  const { email, password, display_name } = data;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
      },
    },
  });

  if (authError) {
    throw new AppError('VALIDATION_ERROR', authError.message);
  }

  if (!authData.user) {
    throw new AppError('INTERNAL_ERROR', 'No se pudo crear el usuario');
  }

  return authData.user;
}

/**
 * Sign in a user
 */
export async function signIn(supabase: Client, data: Login) {
  const { email, password } = data;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    throw new AppError('VALIDATION_ERROR', 'Email o contraseña incorrectos');
  }

  if (!authData.user) {
    throw new AppError('INTERNAL_ERROR', 'No se pudo iniciar sesión');
  }

  return authData.user;
}

/**
 * Sign out the current user
 */
export async function signOut(supabase: Client) {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al cerrar sesión');
  }
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(supabase: Client, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/confirm`,
  });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al enviar email de recuperación');
  }
}

/**
 * Update user password
 */
export async function updatePassword(supabase: Client, newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar contraseña');
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(supabase: Client, userId: string): Promise<UserProfile> {
  const { data: user, error } = await supabase.auth.getUser();

  if (error || !user.user) {
    throw new AppError('NOT_AUTHENTICATED', 'Usuario no autenticado');
  }

  return {
    user_id: user.user.id,
    email: user.user.email || '',
    display_name: user.user.user_metadata?.display_name || '',
    avatar_url: user.user.user_metadata?.avatar_url || null,
    bio: user.user.user_metadata?.bio || null,
    created_at: user.user.created_at,
    updated_at: user.user.updated_at || user.user.created_at,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(supabase: Client, updates: UpdateProfile) {
  const { error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) {
    throw new AppError('INTERNAL_ERROR', 'Error al actualizar perfil');
  }
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
  supabase: Client,
  userId: string,
  file: File,
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('public').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (uploadError) {
    throw new AppError('INTERNAL_ERROR', 'Error al subir avatar');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('public').getPublicUrl(filePath);

  return publicUrl;
}
