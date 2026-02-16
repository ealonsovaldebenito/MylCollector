import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Recuperar contraseña - MYL Deck Builder',
  description: 'Recupera el acceso a tu cuenta',
};

export default function ResetPasswordPage() {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Recuperar contraseña</h2>
        <p className="text-slate-600">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
