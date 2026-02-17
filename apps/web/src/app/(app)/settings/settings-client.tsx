'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/contexts/user-context';
import { useCatalogData } from '@/hooks/use-catalog-data';

const PREF_KEY = 'myl:settings:prefs';

export function SettingsClient() {
  const { profile, user } = useUser();
  const { blocks, editions, races } = useCatalogData();

  const [prefs, setPrefs] = useState<{ block_id: string; edition_id: string; race_id: string }>({
    block_id: '',
    edition_id: '',
    race_id: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREF_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
  }, [prefs]);

  const editionsForBlock = useMemo(() => {
    if (!prefs.block_id) return editions;
    return editions.filter((e) => e.block_id === prefs.block_id);
  }, [prefs.block_id, editions]);

  const racesForEdition = useMemo(() => races, [races]);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Jugador';

  return (
    <div className="container max-w-6xl space-y-6 py-8">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-indigo-500/10 via-surface-1 to-surface-1 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-16 w-16 border border-border/60 shadow-sm">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/15 text-lg font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Configuración</h1>
            <p className="text-sm text-muted-foreground">
              Perfil, seguridad y preferencias para personalizar tu experiencia.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{profile?.role === 'admin' ? 'Admin' : 'Usuario'}</Badge>
              {profile?.email ? <span>{profile.email}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="preferences">Preferencias</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Información del perfil</CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y cómo otros te ven en la plataforma.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar contraseña</CardTitle>
                  <CardDescription>Refuerza la seguridad de tu cuenta.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de juego</CardTitle>
                  <CardDescription>
                    Define bloque, edición y raza favoritas para filtrar y sugerir contenido.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Bloque</p>
                      <Select
                        value={prefs.block_id || 'none'}
                        onValueChange={(v) =>
                          setPrefs((p) => ({ ...p, block_id: v === 'none' ? '' : v, edition_id: '' }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona bloque" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin preferencia</SelectItem>
                          {blocks.map((b) => (
                            <SelectItem key={b.block_id} value={b.block_id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Edición</p>
                      <Select
                        value={prefs.edition_id || 'none'}
                        onValueChange={(v) => setPrefs((p) => ({ ...p, edition_id: v === 'none' ? '' : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona edición" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin preferencia</SelectItem>
                          {editionsForBlock.map((e) => (
                            <SelectItem key={e.edition_id} value={e.edition_id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">Raza</p>
                      <Select
                        value={prefs.race_id || 'none'}
                        onValueChange={(v) => setPrefs((p) => ({ ...p, race_id: v === 'none' ? '' : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona raza" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin preferencia</SelectItem>
                          {racesForEdition.map((r) => (
                            <SelectItem key={r.race_id} value={r.race_id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se guardan localmente en este dispositivo para aplicar filtros rápidos en catálogo y constructor.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Tu identidad visible y rol actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary/15">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{profile?.email || user?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <Badge variant="secondary">{profile?.role ?? 'user'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant="outline">{profile?.is_active ? 'Activo' : 'Inactivo'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social</CardTitle>
              <CardDescription>Amigos y comunidad (beta).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Amigos</span>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Solicitudes</span>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Próximamente podrás gestionar amistades y compartir mazos directamente desde aquí.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

