# 🔧 Configuración de Admin - MYL Deck Builder

## 1. Ejecutar Migración de Roles

Abre el **SQL Editor** en tu dashboard de Supabase y ejecuta el siguiente script:

```sql
-- Ejecuta el contenido completo de DOCS/SQL/005_user_profiles_and_roles.sql
```

O simplemente copia y pega el contenido de `DOCS/SQL/005_user_profiles_and_roles.sql` en el SQL Editor.

## 2. Hacer tu Usuario Admin

### Opción A: Desde SQL Editor (Recomendado)

1. Ve a **SQL Editor** en Supabase
2. Ejecuta:

```sql
-- Reemplaza 'tu-email@ejemplo.com' con tu email real
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'tu-email@ejemplo.com';
```

3. Verifica:

```sql
SELECT user_id, email, role
FROM public.user_profiles
WHERE email = 'tu-email@ejemplo.com';
```

Deberías ver `role: 'admin'`

### Opción B: Desde Table Editor

1. Ve a **Table Editor** → `user_profiles`
2. Busca tu email
3. Edita la columna `role` de `'user'` a `'admin'`
4. Guarda

## 3. Verificar

1. Cierra sesión en la app
2. Vuelve a iniciar sesión
3. Deberías ver el item **"Admin"** en el sidebar
4. Navega a `/admin` para acceder al panel de administración

## 4. Crear Más Admins (Opcional)

Una vez que eres admin, puedes promover a otros usuarios desde el panel de admin:

1. Ve a `/admin/users` (próximamente)
2. Selecciona un usuario
3. Cambia su rol a "Admin"

## 5. Verificación Rápida

Ejecuta en SQL Editor:

```sql
-- Ver todos los admins
SELECT email, role, created_at
FROM public.user_profiles
WHERE role = 'admin';

-- Ver todos los usuarios
SELECT email, role, is_active, created_at
FROM public.user_profiles
ORDER BY created_at DESC;
```

## Solución de Problemas

### No veo el menú Admin después de cambiar el rol

1. Cierra sesión completamente
2. Borra la caché del navegador (Ctrl+Shift+Del)
3. Vuelve a iniciar sesión

### Error al ejecutar la migración

Si ya tienes la tabla `user_profiles`:

```sql
-- Primero elimina la tabla antigua
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Luego ejecuta el script completo de nuevo
```

### No existe mi perfil en user_profiles

Si te registraste antes de crear la tabla:

```sql
-- Crear perfil manualmente
INSERT INTO public.user_profiles (user_id, email, display_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  'admin'  -- O 'user' si no quieres admin
FROM auth.users
WHERE email = 'tu-email@ejemplo.com';
```
