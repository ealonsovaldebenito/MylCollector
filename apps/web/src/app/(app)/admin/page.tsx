/**
 * /admin — Panel de administracion
 * Navegacion central a todos los modulos de admin.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, DollarSign, Settings, Shield, BarChart3, Layers, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin | MYL',
  description: 'Panel de administración',
};

export default function AdminPage() {
  const sections = [
    {
      title: 'Gestión de Cartas',
      description: 'Administra el catalogo de cartas, crear, editar y eliminar',
      href: '/admin/cards',
      icon: BookOpen,
      enabled: true,
      color: 'indigo',
    },
    {
      title: 'Impresiones',
      description: 'Ver todas las impresiones, editar imagenes y estado legal',
      href: '/admin/printings',
      icon: Layers,
      enabled: true,
      color: 'cyan',
    },
    {
      title: 'Etiquetas',
      description: 'Gestiona etiquetas (mecanicas) para clasificar cartas',
      href: '/admin/tags',
      icon: Tag,
      enabled: true,
      color: 'emerald',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administra usuarios, roles y permisos del sistema',
      href: '/admin/users',
      icon: Users,
      enabled: true,
      color: 'amber',
    },
    {
      title: 'Precios',
      description: 'Moderar sugerencias de precios de la comunidad',
      href: '/admin/prices',
      icon: DollarSign,
      enabled: false,
      color: 'green',
    },
    {
      title: 'Reportes',
      description: 'Revisar reportes de usuarios y contenido',
      href: '/admin/reports',
      icon: BarChart3,
      enabled: false,
      color: 'purple',
    },
    {
      title: 'Configuración',
      description: 'Configuración general de la plataforma',
      href: '/admin/settings',
      icon: Settings,
      enabled: false,
      color: 'slate',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-amber-500">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Gestiona el contenido y configuración de la plataforma
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const isEnabled = section.enabled;

          const card = (
            <Card
              className={`relative overflow-hidden transition-all ${
                isEnabled
                  ? 'cursor-pointer border-2 hover:border-primary hover:shadow-lg'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-${section.color}-500/10 blur-2xl`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${section.color}-100`}>
                    <Icon className={`h-6 w-6 text-${section.color}-600`} />
                  </div>
                  {!isEnabled && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      Próximamente
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          );

          return isEnabled ? (
            <Link key={section.href} href={section.href}>
              {card}
            </Link>
          ) : (
            <div key={section.href}>{card}</div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cartas</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios Activos</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mazos Públicos</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reportes Pendientes</CardDescription>
            <CardTitle className="text-3xl">-</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
