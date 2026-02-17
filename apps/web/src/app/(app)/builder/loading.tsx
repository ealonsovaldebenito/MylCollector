import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the deck builder workspace.
 * This segment is used for deck editing (/builder/:deckId), so keep the skeleton generic.
 */
export default function BuilderLoading() {
  return (
    <div className="animate-fade-in h-screen p-4">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-40" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Workspace */}
      <div className="mt-4 grid h-[calc(100%-4rem)] gap-4 lg:grid-cols-[360px_1fr_360px]">
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[520px] w-full" />
        </div>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
