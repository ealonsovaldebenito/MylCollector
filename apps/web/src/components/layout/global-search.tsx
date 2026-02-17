/**
 * GlobalSearch — Búsqueda global con Ctrl+K (CommandDialog de shadcn).
 * Busca en cartas y navega a rutas del sistema.
 *
 * Changelog:
 *   2026-02-18 — Creación inicial
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  BookOpen,
  Hammer,
  Library,
  DollarSign,
  Users,
  ScrollText,
  Search,
  CreditCard,
} from 'lucide-react';

interface CardResult {
  card_id: string;
  name: string;
  card_type_name?: string;
}

const NAV_ITEMS = [
  { label: 'Catálogo', href: '/catalog', icon: BookOpen },
  { label: 'Constructor de Mazos', href: '/decks', icon: Hammer },
  { label: 'Mi Colección', href: '/collection', icon: Library },
  { label: 'Precios', href: '/prices', icon: DollarSign },
  { label: 'Comunidad', href: '/community', icon: Users },
  { label: 'Recursos', href: '/resources', icon: ScrollText },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cards, setCards] = useState<CardResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ctrl+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced search
  const searchCards = useCallback(async (q: string) => {
    if (q.length < 2) {
      setCards([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/v1/cards?q=${encodeURIComponent(q)}&limit=6`);
      const json = await res.json();
      if (json.ok) {
        setCards(
          (json.data?.items ?? []).map((c: Record<string, unknown>) => ({
            card_id: c.card_id as string,
            name: c.name as string,
            card_type_name: (c.card_type_name as string) ?? '',
          })),
        );
      }
    } catch {
      // Silently fail
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCards(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchCards]);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery('');
    setCards([]);
    router.push(href);
  };

  return (
    <>
      {/* Trigger button in topbar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 transition-all hover:border-accent/30 hover:bg-muted/40 sm:flex"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Buscar...</span>
        <kbd className="ml-3 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar cartas, páginas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? 'Buscando...' : 'No se encontraron resultados.'}
          </CommandEmpty>

          {cards.length > 0 && (
            <CommandGroup heading="Cartas">
              {cards.map((card) => (
                <CommandItem
                  key={card.card_id}
                  value={card.name}
                  onSelect={() => navigate(`/catalog?card=${card.card_id}`)}
                >
                  <CreditCard className="mr-2 h-4 w-4 text-accent" />
                  <span>{card.name}</span>
                  {card.card_type_name && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {card.card_type_name}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Navegación">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => navigate(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
