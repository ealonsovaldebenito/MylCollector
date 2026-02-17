import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the decks dashboard page.
 * Shows stats summary + deck list placeholders.
 */
export default function DecksLoading() {
  return (
    <div className="animate-fade-in space-y-6 p-2">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-fade-in rounded-lg border border-border p-4 space-y-2"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Deck list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-fade-in flex items-center gap-4 rounded-lg border border-border p-4"
            style={{ animationDelay: `${(i + 3) * 0.05}s` }}
          >
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
