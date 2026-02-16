'use client';

/**
 * Simple toast hook placeholder
 * For a full implementation, consider using sonner or react-hot-toast
 */
export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
  }: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => {
    // For now, just console log
    // TODO: Implement proper toast UI (sonner or react-hot-toast)
    console.log(`[Toast ${variant}] ${title}`, description);
  };

  return {
    toast,
  };
}
