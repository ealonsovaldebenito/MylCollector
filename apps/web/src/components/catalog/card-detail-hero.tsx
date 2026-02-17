'use client';

import type { CardDetail } from '@myl/shared';
import { editionDisplayName, parseAbilityText, ABILITY_TYPE_COLORS } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { CardImage } from './card-image';
import { Swords, Coins, Users, Paintbrush, Layers, Hash, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardDetailHeroProps {
  card: CardDetail;
  printing?: CardDetail['printings'][number] | null;
}

export function CardDetailHero({ card, printing }: CardDetailHeroProps) {
  const activePrinting = printing ?? card.printings[0] ?? null;
  const heroImage = activePrinting?.image_url ?? null;
  const abilitySections = card.text ? parseAbilityText(card.text) : [];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
      {/* Left: Card image */}
      <div className="relative mx-auto w-full max-w-xs lg:max-w-none">
        <CardImage
          src={heroImage}
          alt={card.name}
          className="aspect-[5/7] w-full rounded-xl shadow-xl border border-border"
          priority
        />
        {/* Favorite button */}
        <button
          type="button"
          className="absolute left-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border shadow-md transition-all hover:bg-destructive/10 hover:border-destructive/30 hover:scale-110"
          title="Agregar a favoritos"
        >
          <Heart className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
        </button>
      </div>

      {/* Right: Card info */}
      <div className="space-y-5">
        {/* Name */}
        <h1 className="font-display text-3xl font-bold lg:text-4xl">{card.name}</h1>

        {/* Type badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">
            {card.card_type.name}
          </Badge>
          {card.race && (
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {card.race.name}
            </Badge>
          )}
          {activePrinting && (
            <Badge variant="outline" className="px-3 py-1 text-sm">
              {editionDisplayName(activePrinting.edition.name)}
            </Badge>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4">
          {card.ally_strength !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <Swords className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Fuerza</p>
                <p className="text-lg font-bold font-mono">{card.ally_strength}</p>
              </div>
            </div>
          )}
          {card.cost !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <Coins className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Coste</p>
                <p className="text-lg font-bold font-mono">{card.cost}</p>
              </div>
            </div>
          )}
          {card.race && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <Users className="h-4 w-4 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">Raza</p>
                <p className="text-lg font-bold">{card.race.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-2">
          {card.is_unique && (
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-3 py-1">
              Unica
            </Badge>
          )}
          {card.has_ability && (
            <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 px-3 py-1">
              Con habilidad
            </Badge>
          )}
          {card.can_be_starting_gold && (
            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-3 py-1">
              Oro inicial
            </Badge>
          )}
        </div>

        {/* Ability text */}
        {abilitySections.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Habilidad
            </h3>
            {abilitySections.map((section, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 space-y-2"
              >
                {section.type !== 'GENERICA' && (
                  <p className={cn('text-sm font-bold uppercase tracking-wide', ABILITY_TYPE_COLORS[section.type])}>
                    {section.type}
                  </p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Flavor text */}
        {card.flavor_text && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Texto epico
            </h3>
            <blockquote className="border-l-2 border-accent/50 pl-4 italic text-muted-foreground text-sm leading-relaxed">
              {card.flavor_text}
            </blockquote>
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground pt-2 border-t border-border">
          {activePrinting?.illustrator && (
            <div className="flex items-center gap-1.5">
              <Paintbrush className="h-3.5 w-3.5" />
              <span>Ilustrador: <span className="text-foreground">{activePrinting.illustrator}</span></span>
            </div>
          )}
          {activePrinting?.edition && (
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Edición: <span className="text-foreground">{editionDisplayName(activePrinting.edition.name)}</span></span>
            </div>
          )}
          {activePrinting?.collector_number && (
            <div className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              <span>Código: <span className="text-foreground font-mono">{activePrinting.collector_number}</span></span>
            </div>
          )}
        </div>

        {/* Tags / Mechanics */}
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {card.tags.map((tag) => (
              <Badge
                key={tag.tag_id}
                variant="outline"
                className="px-3 py-1 text-sm border-accent/30 text-accent hover:bg-accent/10 transition-colors"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
