import { SignupForm } from '@/components/auth/signup-form';

export const metadata = {
  title: 'Crear cuenta - MYL Deck Builder',
  description: 'Crea tu cuenta en MYL Deck Builder',
};

export default function SignupPage() {
  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Crear cuenta</h2>
        <p className="text-muted-foreground">
          Completa el formulario para unirte a la comunidad
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
