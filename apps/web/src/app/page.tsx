import { Swords, BookOpen, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Glow accent */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center gap-8 text-center">
        {/* Badge */}
        <div className="animate-fade-in rounded-full border border-accent/30 bg-accent/5 px-4 py-1.5 text-xs font-medium tracking-wider text-accent uppercase">
          Plataforma de Mazos MYL
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in stagger-1 font-display text-5xl leading-tight font-bold tracking-tight md:text-6xl">
          Construye mazos validos.
          <br />
          <span className="text-accent">Decide con datos.</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in stagger-2 max-w-md text-lg text-muted-foreground">
          Catalogo completo, validacion en vivo, precios comunitarios y
          herramientas para jugadores competitivos.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in stagger-3 flex flex-wrap items-center justify-center gap-4">
          <a
            href="/builder"
            className="group flex items-center gap-2 rounded-lg bg-primary px-7 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <Swords className="h-4 w-4 transition-transform group-hover:rotate-12" />
            Entrar al Builder
          </a>
          <a
            href="/catalog"
            className="flex items-center gap-2 rounded-lg border border-border px-7 py-3 font-medium transition-all hover:border-accent/50 hover:bg-accent/5"
          >
            <BookOpen className="h-4 w-4" />
            Explorar catalogo
          </a>
        </div>

        {/* Features grid */}
        <div className="mt-8 grid w-full max-w-lg grid-cols-3 gap-4">
          {[
            { icon: Swords, label: 'Builder', desc: 'Validacion en vivo' },
            { icon: BookOpen, label: 'Catalogo', desc: 'Filtros pro' },
            { icon: Sparkles, label: 'Precios', desc: 'Datos comunidad' },
          ].map((feature, i) => (
            <div
              key={feature.label}
              className={`animate-fade-in stagger-${i + 3} flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-accent/40 hover:shadow-md`}
            >
              <feature.icon className="h-5 w-5 text-accent" />
              <span className="text-sm font-semibold">{feature.label}</span>
              <span className="text-xs text-muted-foreground">{feature.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
