import Link from 'next/link';
import {
  Swords,
  BookOpen,
  DollarSign,
  FolderOpen,
  Library,
  ScrollText,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Layers,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Catálogo completo',
    desc: 'Todas las cartas de MYL con filtros avanzados por bloque, edición, tipo, raza, coste y rareza.',
    href: '/catalog',
    color: 'from-blue-600 to-cyan-500',
    glow: 'bg-blue-500/20',
  },
  {
    icon: Swords,
    title: 'Constructor de mazos',
    desc: 'Arma tu mazo de 50 cartas con validación en tiempo real según las reglas oficiales.',
    href: '/decks/new',
    color: 'from-indigo-600 to-violet-500',
    glow: 'bg-indigo-500/20',
  },
  {
    icon: DollarSign,
    title: 'Precios de mercado',
    desc: 'Compara precios de tiendas chilenas y accede al historial de precios por carta.',
    href: '/prices',
    color: 'from-emerald-600 to-teal-500',
    glow: 'bg-emerald-500/20',
  },
  {
    icon: FolderOpen,
    title: 'Mis Mazos',
    desc: 'Guarda, versiona y exporta tus mazos en TXT, CSV o JSON. Importa mazos de otros jugadores.',
    href: '/decks',
    color: 'from-amber-600 to-orange-500',
    glow: 'bg-amber-500/20',
  },
  {
    icon: ScrollText,
    title: 'Recursos oficiales',
    desc: 'Oráculos, ban lists, reglas del juego y glosario actualizados periódicamente.',
    href: '/resources',
    color: 'from-violet-600 to-purple-500',
    glow: 'bg-violet-500/20',
  },
  {
    icon: Library,
    title: 'Mi Colección',
    desc: 'Registra las cartas que tienes y consulta su valor estimado total.',
    href: '/collection',
    color: 'from-rose-600 to-pink-500',
    glow: 'bg-rose-500/20',
  },
];

const HIGHLIGHTS = [
  { icon: CheckCircle2, text: 'Validación en vivo con 13 reglas oficiales' },
  { icon: TrendingUp, text: 'Precios actualizados de tiendas chilenas' },
  { icon: Layers, text: 'Export/import en TXT, CSV y JSON' },
  { icon: Zap, text: 'Estadísticas: curva de coste, distribución por tipo y raza' },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none fixed inset-0 opacity-30">
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="absolute -bottom-40 left-0 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[150px]" />
      </div>

      {/* ══════════ NAV BAR ══════════ */}
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-amber-500 text-sm font-bold text-white shadow-md">
            M
          </div>
          <span className="font-display text-xl font-bold tracking-tight">MYL</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/catalog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Catálogo
          </Link>
          <Link href="/decks" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Constructor
          </Link>
          <Link href="/resources" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Recursos
          </Link>
          <Link href="/prices" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Precios
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-px"
          >
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Badge */}
          <div className="animate-fade-in rounded-full border border-accent/30 bg-accent/5 px-5 py-1.5 text-xs font-medium tracking-wider text-accent uppercase">
            <Sparkles className="mr-1.5 inline h-3 w-3" />
            Plataforma de Mazos MYL
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in stagger-1 max-w-3xl font-display text-5xl leading-[1.1] font-bold tracking-tight md:text-7xl">
            Construye mazos válidos.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-amber-400 bg-clip-text text-transparent">
              Decide con datos.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in stagger-2 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Catálogo completo, validación en tiempo real, precios de tiendas y herramientas
            para jugadores competitivos de Mitos y Leyendas.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in stagger-3 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/decks"
              className="group flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              <Swords className="h-5 w-5 transition-transform group-hover:rotate-12" />
              Entrar al Constructor
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/catalog"
              className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/50 px-8 py-3.5 font-semibold backdrop-blur transition-all hover:border-accent/40 hover:bg-accent/5 hover:-translate-y-0.5"
            >
              <BookOpen className="h-5 w-5" />
              Explorar catálogo
            </Link>
          </div>

          {/* Highlights */}
          <div className="animate-fade-in stagger-4 mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <h.icon className="h-4 w-4 text-accent" />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES GRID ══════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Todo lo que necesitas para MYL
          </h2>
          <p className="mt-3 text-muted-foreground">
            Una plataforma completa diseñada para jugadores competitivos y coleccionistas.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Link
              key={f.title}
              href={f.href}
              className="animate-fade-in group relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur transition-all hover:border-accent/30 hover:shadow-xl hover:-translate-y-1"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {/* Glow */}
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${f.glow} blur-2xl transition-opacity opacity-40 group-hover:opacity-70`} />

              <div className="relative">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  Ir al módulo
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="relative z-10 border-t border-border/40 bg-card/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-amber-500 text-xs font-bold text-white">
              M
            </div>
            <span className="font-display font-bold">MYL</span>
            <span className="text-xs text-muted-foreground">Plataforma de Mazos</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/catalog" className="hover:text-foreground transition-colors">Catálogo</Link>
            <Link href="/decks" className="hover:text-foreground transition-colors">Constructor</Link>
            <Link href="/resources" className="hover:text-foreground transition-colors">Recursos</Link>
            <Link href="/prices" className="hover:text-foreground transition-colors">Precios</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
