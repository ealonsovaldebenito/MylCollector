'use client';

import type { DeckItem } from '@/hooks/use-my-decks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Layers, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeckListPanelProps {
  decks: DeckItem[];
  isLoading: boolean;
  error: string | null;
  onCreateNew: () => void;
  onOpenDeck: (deckId: string) => void;
}

export function DeckListPanel({ decks, isLoading, error, onCreateNew, onOpenDeck }: DeckListPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Mazos</h1>
          <p className="text-sm text-muted-foreground">
            Crea y gestiona tus mazos de MYL
          </p>
        </div>
        <Button onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Mazo
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-semibold">No tienes mazos aun</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Crea tu primer mazo para empezar a construir
              </p>
              <Button onClick={onCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primer Mazo
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {decks.map((deck) => (
                <Card
                  key={deck.deck_id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
                  onClick={() => onOpenDeck(deck.deck_id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-base">{deck.name}</CardTitle>
                      <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                        {deck.format.name}
                      </Badge>
                    </div>
                    {deck.description && (
                      <CardDescription className="line-clamp-2 text-xs">
                        {deck.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Actualizado{' '}
                        {formatDistanceToNow(new Date(deck.updated_at), { addSuffix: true, locale: es })}
                      </span>
                      <Badge variant={deck.visibility === 'PUBLIC' ? 'default' : 'secondary'} className="h-4 text-[9px]">
                        {deck.visibility === 'PUBLIC' ? 'Público' : deck.visibility === 'UNLISTED' ? 'No listado' : 'Privado'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
