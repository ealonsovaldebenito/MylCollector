'use client';

import { use } from 'react';
import { BuilderWorkspace } from '@/components/builder/builder-workspace';

interface EditDeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default function EditDeckPage({ params }: EditDeckPageProps) {
  const { deckId } = use(params);
  return <BuilderWorkspace initialDeckId={deckId} />;
}
