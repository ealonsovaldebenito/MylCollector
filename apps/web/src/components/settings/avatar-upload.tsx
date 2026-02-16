'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

interface AvatarUploadProps {
  currentUrl: string | null;
  displayName: string;
  onUploadComplete?: (url: string) => void;
}

export function AvatarUpload({ currentUrl, displayName, onUploadComplete }: AvatarUploadProps) {
  const { uploadAvatar, isLoading } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen debe ser menor a 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadAvatar(file);
    if (url && onUploadComplete) {
      onUploadComplete(url);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={previewUrl || undefined} alt={displayName} />
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Cambiar avatar
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">JPG, PNG o GIF. Max 2MB.</p>
      </div>
    </div>
  );
}
