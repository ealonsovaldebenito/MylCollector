import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Recuperar contraseña - MYL Deck Builder',
  description: 'Recupera el acceso a tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Recuperar contraseña</h2>
        <p className="text-muted-foreground">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
