import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Iniciar sesión - MYL Deck Builder',
  description: 'Inicia sesión en tu cuenta de MYL Deck Builder',
};

export default function LoginPage() {
  return (
    <div className="w-full rounded-2xl border border-border/40 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Iniciar sesión</h2>
        <p className="text-muted-foreground">
          Ingresa tu email y contraseña para acceder a tu cuenta
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
