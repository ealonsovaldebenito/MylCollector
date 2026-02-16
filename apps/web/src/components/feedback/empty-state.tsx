import type { LucideIcon } from 'lucide-react';

/**
 * Estado vacio reutilizable (doc 08, sec 13.2).
 * Toda vista debe tener un estado empty con CTA real.
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground" />}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <a
          href={action.href}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
        >
          {action.label}
        </a>
      )}
      {children}
    </div>
  );
}
