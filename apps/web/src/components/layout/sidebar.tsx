'use client';

import { useMemo, memo } from 'react';
import {
  BookOpen,
  Hammer,
  Library,
  DollarSign,
  Users,
  Shield,
  ScrollText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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
    label: 'Explorar',
    items: [
      { label: 'Catálogo', href: '/catalog', icon: BookOpen },
      { label: 'Precios', href: '/prices', icon: DollarSign },
      { label: 'Recursos', href: '/resources', icon: ScrollText },
    ],
  },
  {
    label: 'Mis herramientas',
    items: [
      { label: 'Constructor', href: '/decks', icon: Hammer, requiresAuth: true, badge: 'Pro' },
      { label: 'Mi Colección', href: '/collection', icon: Library, requiresAuth: true },
    ],
  },
  {
    label: 'Social',
    items: [
      { label: 'Comunidad', href: '/community', icon: Users, requiresAuth: true },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { label: 'Admin', href: '/admin', icon: Shield, requiresAdmin: true },
    ],
  },
];

function SidebarComponent() {
  const { user, isLoading, isAdmin } = useUser();
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
    <aside className="hidden w-60 flex-col border-r border-border/50 bg-card/80 backdrop-blur-sm md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Link href="/catalog" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-amber-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
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
                <div className="h-8 skeleton-shimmer rounded-lg" />
                <div className="h-8 skeleton-shimmer rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          filteredGroups.map((group, gi) => (
            <div
              key={group.label}
              className={cn('animate-fade-in', gi > 0 && 'mt-5')}
              style={{ animationDelay: `${gi * 0.05}s` }}
            >
              {/* Group label */}
              <div className="mb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
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
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                        isActive
                          ? 'bg-accent/15 text-foreground font-medium shadow-sm'
                          : 'text-muted-foreground hover:bg-accent/8 hover:text-foreground',
                      )}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                      )}

                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-accent' : 'group-hover:text-accent',
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
                          'h-3 w-3 text-muted-foreground/40 transition-all',
                          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
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
        <div className="border-t border-border/50 p-3">
          <Link href="/login">
            <div className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-amber-600 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg hover:-translate-y-px">
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:rotate-12" />
              Iniciar sesión
            </div>
          </Link>
        </div>
      )}

      {/* User footer when logged in */}
      {!isLoading && user && (
        <div className="border-t border-border/50 px-4 py-3">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-amber-500 text-[10px] font-bold text-white">
              {(user.user_metadata?.display_name || user.email || 'U')
                .charAt(0)
                .toUpperCase()}
            </div>
            <span className="truncate text-xs">
              {user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario'}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}

export const Sidebar = memo(SidebarComponent);
