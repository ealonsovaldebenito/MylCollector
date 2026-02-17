/**
 * /admin — Panel de administración
 * Navegación central a todos los módulos de admin con estilo visual mejorado.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  BookOpen,
  BookOpenCheck,
  Users,
  DollarSign,
  Settings,
  Shield,
  BarChart3,
  Layers,
  Tag,
  ShieldX,
  Store,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin | MYL',
  description: 'Panel de administración',
};

const sections = [
  {
    title: 'Cartas',
    description: 'Crear, editar y eliminar cartas del catálogo',
    href: '/admin/cards',
    icon: BookOpen,
    enabled: true,
    gradient: 'from-blue-600 to-indigo-600',
    glow: 'bg-blue-500/15',
  },
  {
    title: 'Impresiones',
    description: 'Gestionar imágenes, estado legal y variantes',
    href: '/admin/printings',
    icon: Layers,
    enabled: true,
    gradient: 'from-cyan-600 to-blue-600',
    glow: 'bg-cyan-500/15',
  },
  {
    title: 'Etiquetas',
    description: 'Mecánicas y clasificación de cartas',
    href: '/admin/tags',
    icon: Tag,
    enabled: true,
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'bg-emerald-500/15',
  },
  {
    title: 'Ban Lists',
    description: 'Restricciones por formato y revisiones históricas',
    href: '/admin/banlists',
    icon: ShieldX,
    enabled: true,
    gradient: 'from-rose-600 to-red-600',
    glow: 'bg-rose-500/15',
  },
  {
    title: 'Oráculos',
    description: 'Rulings oficiales, erratas y aclaraciones',
    href: '/admin/oracles',
    icon: BookOpenCheck,
    enabled: true,
    gradient: 'from-violet-600 to-purple-600',
    glow: 'bg-violet-500/15',
  },
  {
    title: 'Tiendas',
    description: 'Scrapers de precios, links y monitoreo',
    href: '/admin/stores',
    icon: Store,
    enabled: true,
    gradient: 'from-teal-600 to-emerald-600',
    glow: 'bg-teal-500/15',
  },
  {
    title: 'Usuarios',
    description: 'Roles, permisos y gestión de cuentas',
    href: '/admin/users',
    icon: Users,
    enabled: true,
    gradient: 'from-amber-600 to-orange-600',
    glow: 'bg-amber-500/15',
  },
  {
    title: 'Precios',
    description: 'Moderar sugerencias de precios comunitarios',
    href: '/admin/prices',
    icon: DollarSign,
    enabled: false,
    gradient: 'from-green-600 to-emerald-600',
    glow: 'bg-green-500/15',
  },
  {
    title: 'Reportes',
    description: 'Revisar reportes de usuarios y contenido',
    href: '/admin/reports',
    icon: BarChart3,
    enabled: false,
    gradient: 'from-purple-600 to-pink-600',
    glow: 'bg-purple-500/15',
  },
  {
    title: 'Configuración',
    description: 'Ajustes generales de la plataforma',
    href: '/admin/settings',
    icon: Settings,
    enabled: false,
    gradient: 'from-slate-600 to-zinc-600',
    glow: 'bg-slate-500/15',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona el contenido y configuración de la plataforma
          </p>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, i) => {
          const Icon = section.icon;
          const isEnabled = section.enabled;

          const content = (
            <div
              className={`animate-fade-in group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-5 transition-all ${
                isEnabled
                  ? 'cursor-pointer hover:border-accent/30 hover:shadow-xl hover:-translate-y-0.5'
                  : 'cursor-not-allowed opacity-40'
              }`}
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Background glow */}
              <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full ${section.glow} blur-2xl transition-opacity group-hover:opacity-100 opacity-50`} />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${section.gradient} shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  {!isEnabled && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                      Próximamente
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-base font-semibold">{section.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>

                {isEnabled && (
                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Gestionar
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            </div>
          );

          return isEnabled ? (
            <Link key={section.href} href={section.href}>
              {content}
            </Link>
          ) : (
            <div key={section.href}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
