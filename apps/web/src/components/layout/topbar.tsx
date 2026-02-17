'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Swords,
  Menu,
  X,
  BookOpen,
  DollarSign,
  Hammer,
  Library,
  ScrollText,
  Users,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { useUser } from '@/contexts/user-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Route label map for breadcrumb display */
const ROUTE_LABELS: Record<string, string> = {
  catalog: 'Catálogo',
  builder: 'Constructor',
  decks: 'Mis Mazos',
  collection: 'Mi Colección',
  prices: 'Precios',
  resources: 'Recursos',
  community: 'Comunidad',
  dashboard: 'Dashboard',
  admin: 'Admin',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
  cards: 'Cartas',
  stores: 'Tiendas',
  banlists: 'Ban Lists',
  oracles: 'Oráculos',
  rules: 'Reglas',
  glossary: 'Glosario',
  banlist: 'Ban List',
};

const mobileNavItems = [
  { label: 'Catálogo', href: '/catalog', icon: BookOpen },
  { label: 'Precios', href: '/prices', icon: DollarSign },
  { label: 'Constructor', href: '/decks', icon: Hammer, requiresAuth: true },
  { label: 'Mi Colección', href: '/collection', icon: Library, requiresAuth: true },
  { label: 'Recursos', href: '/resources', icon: ScrollText },
  { label: 'Comunidad', href: '/community', icon: Users, requiresAuth: true },
  { label: 'Admin', href: '/admin', icon: Shield, requiresAdmin: true },
];

export function Topbar() {
  const { user, isAdmin } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Build breadcrumb from pathname
  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, i) => ({
      label: ROUTE_LABELS[seg] || seg,
      href: '/' + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
      isUUID: /^[0-9a-f-]{36}$/i.test(seg),
    }));
  }, [pathname]);

  const visibleMobileItems = mobileNavItems.filter((item) => {
    if ('requiresAdmin' in item && item.requiresAdmin) return isAdmin;
    if ('requiresAuth' in item && item.requiresAuth) return !!user;
    return true;
  });

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b border-border/50 bg-card/50 px-4 backdrop-blur-sm md:px-5">
        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Breadcrumb — desktop */}
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {crumb.isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.isUUID ? '...' : crumb.label}
                </span>
              ) : (
                <>
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.isUUID ? '...' : crumb.label}
                  </Link>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                </>
              )}
            </div>
          ))}
          {breadcrumbs.length === 0 && (
            <span className="text-muted-foreground">Inicio</span>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search button */}
        <div className="hidden items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 transition-all hover:border-accent/30 hover:bg-muted/40 sm:flex">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Buscar...</span>
          <kbd className="ml-3 rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Ctrl+K
          </kbd>
        </div>

        {/* Builder CTA */}
        {user && (
          <Link href="/decks">
            <div className="group flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-amber-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:shadow-md hover:-translate-y-px">
              <Swords className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              <span className="hidden sm:inline">Constructor</span>
            </div>
          </Link>
        )}

        <UserMenu />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-fade-in border-b border-border/50 bg-card/95 backdrop-blur-md md:hidden">
          <nav className="space-y-0.5 p-3">
            {visibleMobileItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                    isActive
                      ? 'bg-accent/15 text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-accent/8 hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-4 w-4', isActive && 'text-accent')} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
