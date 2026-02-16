'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlockCompletion, EditionCompletion } from '@myl/shared';

interface CompletionProgressProps {
  completion: BlockCompletion | EditionCompletion | null;
  isLoading: boolean;
  type: 'block' | 'edition';
  className?: string;
}

export function CompletionProgress({
  completion,
  isLoading,
  type,
  className,
}: CompletionProgressProps) {
  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </Card>
    );
  }

  if (!completion) {
    return null;
  }

  const isBlock = type === 'block';
  const percentage = completion.completion_percentage;
  const total = isBlock
    ? (completion as BlockCompletion).total_unique_cards
    : (completion as EditionCompletion).total_printings;
  const owned = isBlock
    ? (completion as BlockCompletion).owned_unique_cards
    : (completion as EditionCompletion).owned_printings;

  const title = isBlock
    ? (completion as BlockCompletion).block_name
    : (completion as EditionCompletion).edition_name;

  const progressColor =
    percentage >= 100
      ? 'bg-green-500'
      : percentage >= 75
        ? 'bg-blue-500'
        : percentage >= 50
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <Card className={cn('p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">
                {isBlock ? 'Completitud de Bloque' : 'Completitud de Edición'}
              </h3>
            </div>
            <p className="text-2xl font-display font-bold text-foreground mt-2">{title}</p>
          </div>
          <Badge
            variant={percentage >= 100 ? 'default' : 'secondary'}
            className="text-lg font-mono px-3 py-1"
          >
            {percentage.toFixed(1)}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', progressColor)}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {owned} de {total} {isBlock ? 'cartas únicas' : 'impresiones'}
          </p>
        </div>

        {/* Milestones */}
        <div className="flex gap-2 flex-wrap">
          {[
            { threshold: 25, label: '25%', reached: percentage >= 25 },
            { threshold: 50, label: '50%', reached: percentage >= 50 },
            { threshold: 75, label: '75%', reached: percentage >= 75 },
            { threshold: 100, label: '100%', reached: percentage >= 100 },
          ].map((milestone) => (
            <Badge
              key={milestone.threshold}
              variant={milestone.reached ? 'default' : 'outline'}
              className={cn(
                'text-xs',
                milestone.reached && 'bg-accent text-accent-foreground',
              )}
            >
              {milestone.label}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
