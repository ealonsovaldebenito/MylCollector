import { AlertCircle } from 'lucide-react';

/**
 * Estado de error reutilizable (doc 08, sec 13.2).
 * Muestra mensaje humano + opción de retry.
 */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Ocurrio un error inesperado',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <h3 className="text-lg font-semibold">Error</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
