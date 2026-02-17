import { withApiHandler } from '@/lib/api/with-api-handler';
import { createSuccess } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/lib/api/errors';

export const GET = withApiHandler(async (_request, { requestId: _requestId }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AppError('NOT_AUTHENTICATED', 'Debes iniciar sesión');
  }

  // Use admin client to bypass RLS for role check
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new AppError('FORBIDDEN', 'Solo administradores pueden acceder a esta función');
  }

  try {
    // List users from Auth and merge with user_profiles (backfill missing)
    const { data: authList, error: authError } = await adminClient.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }
    const authUsers = authList?.users ?? [];
    const ids = authUsers.map((u) => u.id);

    const { data: existingProfiles } = await adminClient
      .from('user_profiles')
      .select('*')
      .in('user_id', ids);

    const profileMap = new Map((existingProfiles ?? []).map((p) => [p.user_id, p]));

    const missing = authUsers.filter((u) => !profileMap.has(u.id));
    if (missing.length > 0) {
      const upserts: Array<{
        user_id: string;
        email: string;
        display_name?: string | null;
        avatar_url?: string | null;
        bio?: string | null;
        role: 'user' | 'admin';
        is_active?: boolean;
      }> = missing.map((u) => ({
        user_id: u.id,
        email: u.email ?? '',
        display_name: (u.user_metadata as any)?.display_name ?? u.email?.split('@')[0] ?? 'Usuario',
        avatar_url: (u.user_metadata as any)?.avatar_url ?? null,
        bio: (u.user_metadata as any)?.bio ?? null,
        role: 'user',
        is_active: true,
      }));

      const { data: inserted, error: upsertError } = await adminClient
        .from('user_profiles')
        .upsert(upserts)
        .select('*');

      if (upsertError) {
        throw upsertError;
      }

      inserted?.forEach((p) => profileMap.set(p.user_id, p));
    }

    const users = authUsers
      .map((u) => {
        const p = profileMap.get(u.id);
        return {
          user_id: u.id,
          email: p?.email ?? u.email ?? '',
          display_name:
            p?.display_name ?? (u.user_metadata as any)?.display_name ?? u.email?.split('@')[0] ?? '',
          role: (p?.role as 'user' | 'admin') ?? 'user',
          is_active: p?.is_active ?? true,
          created_at: u.created_at,
        };
      })
      .sort((a, b) => (a.created_at > b.created_at ? -1 : 1));

    return createSuccess({ users });
  } catch (error) {
    // Fallback: show whatever is in user_profiles to avoid lista vacía
    const { data: users, error: fallbackError } = await adminClient
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallbackError) {
      throw new AppError('INTERNAL_ERROR', 'Error al cargar usuarios', { error: fallbackError });
    }

    return createSuccess({ users: users ?? [] });
  }
});
