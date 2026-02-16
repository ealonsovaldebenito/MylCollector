'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { resetPasswordSchema } from '@myl/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function ResetPasswordForm() {
  const { resetPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);

    const result = resetPasswordSchema.safeParse({ email });

    if (!result.success) {
      setValidationError(result.error.errors[0]?.message || 'Email inválido');
      return;
    }

    const sent = await resetPassword(email);
    if (sent) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Email enviado</h3>
          <p className="text-sm text-muted-foreground">
            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          disabled={isLoading}
        />
        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Enviando...' : 'Enviar email de recuperación'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
