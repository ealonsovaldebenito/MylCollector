import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Crear cuenta - MYL Deck Builder',
  description: 'Crea tu cuenta en MYL Deck Builder',
};

export default function SignupPage() {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Crear cuenta</h2>
        <p className="text-slate-600">
          Completa el formulario para unirte a la comunidad
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
