'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | null) {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    } else {
      setPreview(null);
      onChange(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="aspect-[5/7] w-full rounded-lg border border-border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={() => handleFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-[5/7] cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-lg border-2 border-dashed border-border',
            'transition-colors hover:border-accent/50 hover:bg-muted/30',
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              <Upload className="mr-1 inline h-4 w-4" />
              Arrastra o haz click
            </p>
            <p className="text-xs text-muted-foreground/60">WebP, PNG, JPEG (max 5MB)</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/webp,image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          handleFile(file);
        }}
      />
    </div>
  );
}
