import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for the card detail page.
 * Shows hero image + info panel + tabs placeholder.
 */
export default function CardDetailLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Hero section */}
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Card image */}
        <div className="animate-fade-in stagger-1">
          <Skeleton className="aspect-[5/7] w-full max-w-xs rounded-xl" />
        </div>

        {/* Info panel */}
        <div className="flex-1 space-y-4 animate-fade-in stagger-2">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4 animate-fade-in stagger-3">
        <div className="flex gap-4 border-b border-border pb-2">
          {['Reimpresiones', 'Legalidad', 'Precios'].map((_, i) => (
            <Skeleton key={i} className="h-8 w-28" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
