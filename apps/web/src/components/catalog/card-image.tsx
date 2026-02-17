'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardImageProps {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fit?: 'cover' | 'contain';
}

export function CardImage({ src, alt, className, priority = false, fit = 'cover' }: CardImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50 text-muted-foreground',
          className,
        )}
      >
        <ImageOff className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden bg-muted/30', className)}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          'h-full w-full transition-opacity duration-300',
          fit === 'contain' ? 'object-contain' : 'object-cover',
          isLoaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  );
}
