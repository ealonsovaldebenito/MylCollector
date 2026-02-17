/**
 * Topbar — Barra superior con breadcrumbs, búsqueda global, CTA y menú usuario.
 *
 * Changelog:
 *   2026-02-17 — Rediseño v2: slim h-12, blur backdrop, / separators, theme toggle
 */

'use client';

import { useMemo, useState } from 'react';
import {
  Swords,
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  DollarSign,
  Hammer,
  Library,
  ScrollText,
  Users,
  Shield,
  Settings,
} from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { useUser } from '@/contexts/user-context';
import { GlobalSearch } from '@/components/layout/global-search';
import { ThemeToggle } from '@/components/layout/theme-toggle';
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
  users: 'Usuarios',
  trending: 'Tendencias',
};

const mobileNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresAuth: true },
  { label: 'Catálogo', href: '/catalog', icon: BookOpen },
  { label: 'Constructor', href: '/decks', icon: Hammer, requiresAuth: true },
  { label: 'Mi Colección', href: '/collection', icon: Library, requiresAuth: true },
  { label: 'Precios', href: '/prices', icon: DollarSign },
  { label: 'Comunidad', href: '/community', icon: Users },
  { label: 'Recursos', href: '/resources', icon: ScrollText },
  { label: 'Configuración', href: '/settings', icon: Settings, requiresAuth: true },
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
      <header className="flex h-12 items-center gap-3 border-b border-border/30 bg-background/80 px-4 backdrop-blur-xl md:px-5">
        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-secondary/50 hover:text-foreground active:scale-95 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Breadcrumb — desktop */}
        <nav className="hidden items-center gap-1.5 text-sm md:flex">
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/30">/</span>}
              {crumb.isLast ? (
                <span className="font-medium text-accent">
                  {crumb.isUUID ? '...' : crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.isUUID ? '...' : crumb.label}
                </Link>
              )}
            </div>
          ))}
          {breadcrumbs.length === 0 && (
            <span className="text-muted-foreground">Inicio</span>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Global search (Ctrl+K) */}
        <GlobalSearch />

        {/* Builder CTA */}
        {user && (
          <Link href="/decks">
            <div className="group flex cursor-pointer items-center gap-2 rounded-lg bg-primary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-[0.98]">
              <Swords className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              <span className="hidden sm:inline">Constructor</span>
            </div>
          </Link>
        )}

        <ThemeToggle />
        <UserMenu />
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="animate-slide-in-left fixed inset-y-0 left-0 z-50 w-64 border-r border-border/30 bg-surface-1/95 backdrop-blur-xl md:hidden">
            <div className="flex h-12 items-center gap-2 border-b border-border/20 px-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                M
              </div>
              <span className="font-display font-bold">MYL</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-accent/15 to-transparent text-foreground font-medium'
                        : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive && 'text-accent')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
