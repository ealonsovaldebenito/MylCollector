import Link from 'next/link';
import { AuthBackground } from '@/components/auth/auth-background';
import { Sparkles, Shield, TrendingUp, Users } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AuthBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-border/30 bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center px-4">
          <Link href="/catalog" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white shadow-md">
              M
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              MYL Deck Builder
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center p-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Section */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Construye mazos legendarios
                </div>
                <h1 className="font-display text-5xl font-bold text-foreground lg:text-6xl">
                  Bienvenido a{' '}
                  <span className="text-gradient">MYL</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  La plataforma definitiva para construir, compartir y optimizar tus mazos del juego de
                  cartas MYL.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur-sm shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Constructor Inteligente</h3>
                    <p className="text-sm text-muted-foreground">
                      Validación en tiempo real según las reglas oficiales
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-accent/20 bg-card/60 p-4 backdrop-blur-sm shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Gestión de Colección</h3>
                    <p className="text-sm text-muted-foreground">
                      Lleva el control de tus cartas y completa tu colección
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-xl border border-myl-info/20 bg-card/60 p-4 backdrop-blur-sm shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-myl-info/10">
                    <Users className="h-5 w-5 text-myl-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Comunidad Activa</h3>
                    <p className="text-sm text-muted-foreground">
                      Comparte y descubre mazos de otros jugadores
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auth Form */}
            <div className="flex items-center">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 bg-card/80 p-4 text-center text-xs text-muted-foreground backdrop-blur-sm">
        © 2026 MYL Deck Builder. Todos los derechos reservados.
      </footer>
    </div>
  );
}
