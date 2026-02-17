/**
 * Sidebar — Navegación principal de la app (desktop).
 *
 * Changelog:
 *   2026-02-17 — Rediseño visual v2 + reorganización completa de rutas
 */

'use client';

import { useMemo, memo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Hammer,
  Library,
  DollarSign,
  Users,
  Shield,
  ScrollText,
  ChevronRight,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresAuth: true },
      { label: 'Catálogo', href: '/catalog', icon: BookOpen },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { label: 'Constructor', href: '/decks', icon: Hammer, requiresAuth: true },
      { label: 'Mi Colección', href: '/collection', icon: Library, requiresAuth: true },
      { label: 'Precios', href: '/prices', icon: DollarSign },
    ],
  },
  {
    label: 'Comunidad',
    items: [
      { label: 'Explorar Mazos', href: '/community', icon: Users },
      { label: 'Recursos', href: '/resources', icon: ScrollText },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { label: 'Configuración', href: '/settings', icon: Settings, requiresAuth: true },
      { label: 'Admin', href: '/admin', icon: Shield, requiresAdmin: true },
    ],
  },
];

function SidebarComponent() {
  const { user, profile, isLoading, isAdmin } = useUser();
  const pathname = usePathname();

  const filteredGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (item.requiresAdmin) return isAdmin;
            if (item.requiresAuth) return !!user;
            return true;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [user, isAdmin],
  );

  return (
    <aside className="hidden w-56 flex-col border-r border-border/30 bg-surface-1/80 backdrop-blur-sm md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Link href={user ? '/dashboard' : '/catalog'} className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-lg shadow-primary/20">
            M
          </div>
          <span className="font-display text-lg font-bold tracking-tight">MYL</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-5 p-2">
            {[1, 2, 3].map((g) => (
              <div key={g} className="space-y-1.5">
                <div className="h-3 w-16 skeleton-shimmer rounded" />
                <div className="h-9 skeleton-shimmer rounded-xl" />
                <div className="h-9 skeleton-shimmer rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          filteredGroups.map((group, gi) => (
            <div
              key={group.label}
              className={cn('animate-fade-in', gi > 0 && 'mt-1')}
              style={{ animationDelay: `${gi * 0.05}s` }}
            >
              {/* Separator between groups */}
              {gi > 0 && <hr className="mx-2 mb-2 border-border/20" />}

              {/* Group label */}
              <div className="mb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {group.label}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-accent/15 to-transparent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-all duration-200',
                          isActive
                            ? 'text-accent'
                            : 'group-hover:text-accent group-hover:scale-110',
                        )}
                      />
                      <span className="flex-1">{item.label}</span>

                      {item.badge && (
                        <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                          {item.badge}
                        </span>
                      )}

                      <ChevronRight
                        className={cn(
                          'h-3 w-3 text-muted-foreground/30 transition-all duration-200',
                          isActive ? 'opacity-100 text-accent/60' : 'opacity-0 group-hover:opacity-50',
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* Footer — login prompt */}
      {!isLoading && !user && (
        <div className="border-t border-border/20 p-3 space-y-2">
          <Link href="/login">
            <div className="group flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:-translate-y-px">
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              Iniciar sesión
            </div>
          </Link>
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      )}

      {/* User footer when logged in */}
      {!isLoading && user && (
        <div className="border-t border-border/20 px-3 py-3">
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="flex flex-1 items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-secondary/50 hover:text-foreground"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.display_name ?? user.email ?? 'Usuario'} />
                <AvatarFallback className="bg-primary/15 text-[11px] font-semibold">
                  {(profile?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {profile?.display_name || user.email?.split('@')[0] || 'Usuario'}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {profile?.role === 'admin' ? 'Admin' : 'Jugador'}
                </p>
              </div>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      )}
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
