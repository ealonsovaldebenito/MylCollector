'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { updatePasswordSchema } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export function PasswordForm() {
  const { updatePassword, isLoading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = updatePasswordSchema.safeParse(formData);

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

    const success = await updatePassword(formData.new_password);
    if (success) {
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada correctamente.',
      });
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current_password">Contraseña actual</Label>
        <Input
          id="current_password"
          type="password"
          value={formData.current_password}
          onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {validationErrors.current_password && (
          <p className="text-sm text-destructive">{validationErrors.current_password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password">Nueva contraseña</Label>
        <Input
          id="new_password"
          type="password"
          value={formData.new_password}
          onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {validationErrors.new_password && (
          <p className="text-sm text-destructive">{validationErrors.new_password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirmar nueva contraseña</Label>
        <Input
          id="confirm_password"
          type="password"
          value={formData.confirm_password}
          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {validationErrors.confirm_password && (
          <p className="text-sm text-destructive">{validationErrors.confirm_password}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
      </Button>
    </form>
  );
}
