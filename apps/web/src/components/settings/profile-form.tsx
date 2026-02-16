'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { useAuth } from '@/hooks/use-auth';
import { updateProfileSchema } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AvatarUpload } from './avatar-upload';
import { useToast } from '@/hooks/use-toast';

export function ProfileForm() {
  const { user } = useUser();
  const { updateProfile, isLoading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar_url: null as string | null,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.user_metadata?.display_name || '',
        bio: user.user_metadata?.bio || '',
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = updateProfileSchema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    const success = await updateProfile(formData);
    if (success) {
      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios han sido guardados correctamente.',
      });
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Avatar</Label>
          <div className="mt-2">
            <AvatarUpload
              currentUrl={formData.avatar_url}
              displayName={formData.display_name || user.email || 'Usuario'}
              onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_name">Nombre</Label>
          <Input
            id="display_name"
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Tu nombre"
            disabled={isLoading}
          />
          {validationErrors.display_name && (
            <p className="text-sm text-destructive">{validationErrors.display_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            El email no se puede cambiar por ahora
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografía</Label>
          <Textarea
            id="bio"
            value={formData.bio || ''}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Cuéntanos sobre ti..."
            rows={4}
            disabled={isLoading}
          />
          {validationErrors.bio && (
            <p className="text-sm text-destructive">{validationErrors.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">Máximo 500 caracteres</p>
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
