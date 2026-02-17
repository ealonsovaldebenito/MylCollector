/**
 * /community/users/:userId — Perfil público de usuario.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { use } from 'react';
import { UserPublicProfile } from '@/components/community/user-public-profile';

export default function CommunityUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  return <UserPublicProfile userId={userId} />;
}
