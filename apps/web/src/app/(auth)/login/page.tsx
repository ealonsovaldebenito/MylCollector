import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión - MYL Deck Builder',
  description: 'Inicia sesión en tu cuenta de MYL Deck Builder',
};

export default function LoginPage() {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Iniciar sesión</h2>
        <p className="text-slate-600">
          Ingresa tu email y contraseña para acceder a tu cuenta
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
