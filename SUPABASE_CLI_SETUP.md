# Configurar Supabase CLI (Opcional)

Esta guía es OPCIONAL. Solo necesitas esto si quieres:
- Sincronizar el schema de Supabase con archivos locales
- Generar tipos TypeScript automáticamente desde la DB
- Hacer migraciones versionadas

## 📦 Instalación

```bash
# Windows (usando npm)
npm install -g supabase

# O usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## 🔗 Conectar al Proyecto

```bash
# 1. Login con tu cuenta Supabase
supabase login

# 2. Ir al directorio del proyecto
cd e:/Minstrel/Proyectos/Myl

# 3. Inicializar Supabase (si no está inicializado)
supabase init

# 4. Link al proyecto remoto
supabase link --project-ref pshawtdhlkkubaezvzrv
```

## 🔄 Sincronizar Schema

```bash
# Pull del schema remoto a archivos locales
supabase db pull

# Esto crea migraciones en supabase/migrations/
```

## 📝 Generar Tipos TypeScript

```bash
# Generar tipos desde el schema de Supabase
supabase gen types typescript --project-id pshawtdhlkkubaezvzrv > packages/db/src/database.types.ts
```

## 🚀 Push de Cambios

```bash
# Aplicar migraciones locales al proyecto remoto
supabase db push

# Reset completo (¡CUIDADO! Borra todo)
supabase db reset
```

## ⚠️ IMPORTANTE

**NO necesitas Supabase CLI para el desarrollo normal.** Solo es útil si:
- Quieres versionar el schema en Git
- Trabajas en equipo y necesitas sincronizar cambios
- Quieres auto-generar tipos TypeScript

Para el desarrollo normal, simplemente:
1. Ejecuta SQL directamente en Supabase Dashboard
2. Actualiza los tipos manualmente en `packages/db/src/types.ts`
