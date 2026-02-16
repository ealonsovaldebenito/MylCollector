'use client';

import { useMemo, memo } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Hammer,
  FolderOpen,
  Library,
  DollarSign,
  Users,
  Shield,
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
}

const navItems: NavItem[] = [
  { label: 'Catálogo', href: '/catalog', icon: BookOpen, requiresAuth: false },
  { label: 'Precios', href: '/prices', icon: DollarSign, requiresAuth: false },
  { label: 'Constructor', href: '/builder', icon: Hammer, requiresAuth: true },
  { label: 'Mis Mazos', href: '/decks', icon: FolderOpen, requiresAuth: true },
  { label: 'Mi Colección', href: '/collection', icon: Library, requiresAuth: true },
  { label: 'Comunidad', href: '/community', icon: Users, requiresAuth: true },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, requiresAuth: true },
  { label: 'Admin', href: '/admin', icon: Shield, requiresAdmin: true },
];

function SidebarComponent() {
  const { user, isLoading, isAdmin } = useUser();
  const pathname = usePathname();

  const visibleItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.requiresAdmin) return isAdmin;
        if (item.requiresAuth) return !!user;
        return true;
      }),
    [user, isAdmin],
  );

  return (
    <aside className="hidden w-60 flex-col border-r border-border/60 bg-card md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-amber-500 text-xs font-bold text-white shadow-sm">
          M
        </div>
        <span className="font-display text-lg font-bold tracking-tight">MYL</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {isLoading ? (
          <div className="space-y-2 p-3">
            <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
            <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
          </div>
        ) : (
          visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                  isActive
                    ? 'bg-accent/20 text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-accent' : 'group-hover:text-accent',
                  )}
                />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer */}
      {!user && (
        <div className="border-t border-border/60 p-3">
          <Link href="/login">
            <div className="cursor-pointer rounded-lg bg-gradient-to-r from-indigo-500 to-amber-500 p-3 text-center text-xs font-medium text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-px">
              Iniciar sesión para más funciones
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

// Export memoized component for performance
export const Sidebar = memo(SidebarComponent);
