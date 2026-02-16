'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, ImagePlus, Copy } from 'lucide-react';

interface Printing {
  card_printing_id: string;
  edition_id: string;
  edition_name: string;
  block_id: string;
  block_name: string;
  price_consensus: number | null;
  image_url: string | null;
  rarity_tier_name: string | null;
  legal_status: string;
}

interface CardRow {
  card_id: string;
  name: string;
  card_type: { name: string; code: string };
  race: { name: string; code: string } | null;
  cost: number | null;
  ally_strength: number | null;
  is_unique: boolean;
  printings: Printing[];
  avg_price: number | null;
}

interface CardGridViewProps {
  cards: CardRow[];
  onDelete: (cardId: string, name: string) => void;
  copyToClipboard: (text: string) => void;
}

export function CardGridView({ cards, onDelete, copyToClipboard }: CardGridViewProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => {
        const firstPrinting = card.printings[0];
        return (
          <div
            key={card.card_id}
            className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            <div className="relative aspect-[5/7] bg-muted">
              {firstPrinting?.image_url ? (
                <img
                  src={firstPrinting.image_url}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <ImagePlus className="h-16 w-16" />
                </div>
              )}
              {card.is_unique && (
                <Badge className="absolute top-2 right-2" variant="default">
                  Única
                </Badge>
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              {/* Name */}
              <h3 className="font-semibold text-lg line-clamp-2">{card.name}</h3>

              {/* Type & Race */}
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={
                    card.card_type.code === 'ORO'
                      ? 'default'
                      : card.card_type.code === 'ALIADO'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {card.card_type.name}
                </Badge>
                {card.race && <Badge variant="outline">{card.race.name}</Badge>}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                {card.cost !== null && (
                  <div>
                    <span className="text-muted-foreground">Coste:</span>{' '}
                    <span className="font-mono font-medium">{card.cost}</span>
                  </div>
                )}
                {card.ally_strength !== null && (
                  <div>
                    <span className="text-muted-foreground">Fuerza:</span>{' '}
                    <span className="font-mono font-medium">{card.ally_strength}</span>
                  </div>
                )}
              </div>

              {/* Printings & Price */}
              <div className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  {card.printings.length} impresión{card.printings.length !== 1 ? 'es' : ''}
                </div>
                {card.avg_price !== null && (
                  <div className="font-mono font-medium text-green-600 dark:text-green-400">
                    ${card.avg_price}
                  </div>
                )}
              </div>

              {/* Editions */}
              {firstPrinting && (
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {firstPrinting.edition_name}
                  </Badge>
                  {firstPrinting.rarity_tier_name && (
                    <Badge variant="outline" className="text-xs ml-1">
                      {firstPrinting.rarity_tier_name}
                    </Badge>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(card.card_id)}
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Link href={`/admin/cards/${card.card_id}/printings/new`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full" title="Agregar impresión">
                    <ImagePlus className="h-4 w-4 mr-1" />
                    Printing
                  </Button>
                </Link>
                <Link href={`/admin/cards/${card.card_id}/edit`}>
                  <Button variant="outline" size="icon" className="h-8 w-8" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(card.card_id, card.name)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
