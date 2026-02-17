import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the admin cards list page.
 * Shows search bar + table rows.
 */
export default function AdminCardsLoading() {
  return (
    <div className="animate-fade-in space-y-4 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full max-w-sm" />

      {/* Table */}
      <div className="rounded-lg border border-border">
        {/* Header row */}
        <div className="flex gap-4 border-b border-border p-3">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* Body rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="animate-fade-in flex items-center gap-4 border-b border-border/50 p-3 last:border-0"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <Skeleton className="h-10 w-8 rounded" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
