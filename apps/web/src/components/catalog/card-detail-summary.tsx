'use client';

import type { CardDetail } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Swords, Sparkles, Crown, Tag } from 'lucide-react';

interface CardDetailSummaryProps {
  card: CardDetail;
}

export function CardDetailSummary({ card }: CardDetailSummaryProps) {
  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Tipo:</span>
          <Badge variant="secondary">{card.card_type.name}</Badge>
        </div>

        {card.race && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Raza:</span>
            <Badge variant="secondary">{card.race.name}</Badge>
          </div>
        )}

        {card.cost !== null && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Coste:</span>
            <Badge variant="outline" className="font-mono">{card.cost}</Badge>
          </div>
        )}

        {card.ally_strength !== null && (
          <div className="flex items-center gap-1.5 text-sm">
            <Swords className="h-3.5 w-3.5 text-muted-foreground" />
            <Badge variant="outline" className="font-mono">{card.ally_strength}</Badge>
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2">
        {card.is_unique && (
          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Crown className="mr-1 h-3 w-3" />
            Unica
          </Badge>
        )}
        {card.has_ability && (
          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">
            <Sparkles className="mr-1 h-3 w-3" />
            Con habilidad
          </Badge>
        )}
        {card.can_be_starting_gold && (
          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
            Oro inicial
          </Badge>
        )}
      </div>

      <Separator />

      {/* Ability text */}
      {card.text && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Habilidad
          </h4>
          <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-sm leading-relaxed">
            {card.text}
          </p>
        </div>
      )}

      {/* Flavor text */}
      {card.flavor_text && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Texto de ambientacion
          </h4>
          <p className="italic text-muted-foreground text-sm">
            &ldquo;{card.flavor_text}&rdquo;
          </p>
        </div>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3 w-3" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {card.tags.map((tag) => (
                <Badge key={tag.tag_id} variant="outline" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
