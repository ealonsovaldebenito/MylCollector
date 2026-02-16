'use client';

import { Search, Swords } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { useUser } from '@/hooks/use-user';
import Link from 'next/link';

export function Topbar() {
  const { user } = useUser();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/60 bg-card/50 px-5 backdrop-blur-sm">
      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 transition-all hover:border-accent/30 hover:bg-muted/50">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Buscar cartas, mazos, bloques...</span>
        <kbd className="ml-4 hidden rounded border border-border/80 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
          Ctrl+K
        </kbd>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {user && (
          <Link href="/builder">
            <div className="group flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-amber-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-px">
              <Swords className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              Builder
            </div>
          </Link>
        )}
        <UserMenu />
      </div>
    </header>
  );
}
