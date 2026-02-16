import { Fragment } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1.5 text-sm text-muted-foreground', className)}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
          {item.href ? (
            <Link
              href={item.href}
              className="truncate hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-foreground font-medium">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
