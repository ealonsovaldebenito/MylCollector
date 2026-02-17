import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the catalog page.
 * Shows a sidebar of filters + grid of card placeholders.
 */
export default function CatalogLoading() {
  return (
    <div className="flex h-full animate-fade-in">
      {/* Sidebar filters skeleton */}
      <aside className="hidden w-64 shrink-0 space-y-5 overflow-y-auto border-r border-border p-4 lg:block">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-16" />
        </div>
        <Skeleton className="h-px w-full" />
        {/* Filter groups */}
        {[1, 2, 3].map((g) => (
          <div key={g} className="space-y-2.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search bar */}
        <div className="mb-4 flex items-center gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="animate-fade-in space-y-2"
              style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
            >
              <Skeleton className="aspect-[5/7] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
