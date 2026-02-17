import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the deck builder workspace.
 * Shows 3-column layout placeholders matching the builder design.
 */
export default function BuilderWorkspaceLoading() {
  return (
    <div className="animate-fade-in flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-border p-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Card browser */}
        <div className="hidden w-80 shrink-0 space-y-3 border-r border-border p-3 lg:block">
          <Skeleton className="h-9 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-fade-in flex items-center gap-2"
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              <Skeleton className="h-10 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-16" />
              </div>
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          ))}
        </div>

        {/* Center: Deck editor */}
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
          {['ORO', 'ALIADOS', 'ARMAS'].map((type, gi) => (
            <div
              key={type}
              className="animate-fade-in space-y-2"
              style={{ animationDelay: `${gi * 0.08}s` }}
            >
              <Skeleton className="h-4 w-20" />
              {Array.from({ length: gi === 1 ? 4 : 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-border p-2">
                  <Skeleton className="h-8 w-6 rounded" />
                  <Skeleton className="h-4 w-32 flex-1" />
                  <Skeleton className="h-6 w-16 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Right: Validation + stats */}
        <div className="hidden w-72 shrink-0 space-y-4 border-l border-border p-3 xl:block">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-32 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
