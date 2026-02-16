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
      <header className="relative z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center px-4">
          <Link href="/catalog" className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-amber-500 text-sm font-bold text-white shadow-md">
              M
            </div>
            <span className="font-display text-xl font-bold text-slate-900">
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
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  Construye mazos legendarios
                </div>
                <h1 className="font-display text-5xl font-bold text-slate-900 lg:text-6xl">
                  Bienvenido a{' '}
                  <span className="bg-gradient-to-r from-indigo-600 to-amber-500 bg-clip-text text-transparent">
                    MYL
                  </span>
                </h1>
                <p className="text-xl text-slate-600">
                  La plataforma definitiva para construir, compartir y optimizar tus mazos del juego de
                  cartas MYL.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-lg border border-indigo-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Constructor Inteligente</h3>
                    <p className="text-sm text-slate-600">
                      Validación en tiempo real según las reglas oficiales
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <TrendingUp className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Gestión de Colección</h3>
                    <p className="text-sm text-slate-600">
                      Lleva el control de tus cartas y completa tu colección
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-lg border border-purple-100 bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Comunidad Activa</h3>
                    <p className="text-sm text-slate-600">
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
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 p-4 text-center text-xs text-slate-500 backdrop-blur-sm">
        © 2026 MYL Deck Builder. Todos los derechos reservados.
      </footer>
    </div>
  );
}
