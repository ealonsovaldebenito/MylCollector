'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { signupSchema, type Signup } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export function SignupForm() {
  const { signUp, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<Signup>({
    email: '',
    password: '',
    display_name: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const result = signupSchema.safeParse(formData);

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

    await signUp(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="tu@email.com"
          disabled={isLoading}
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive">{validationErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
          disabled={isLoading}
        />
        {validationErrors.password && (
          <p className="text-sm text-destructive">{validationErrors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}
