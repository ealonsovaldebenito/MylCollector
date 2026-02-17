import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the admin dashboard page.
 * Shows a grid of section cards.
 */
export default function AdminLoading() {
  return (
    <div className="animate-fade-in space-y-6 p-2">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="animate-fade-in rounded-lg border border-border p-5 space-y-3"
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
