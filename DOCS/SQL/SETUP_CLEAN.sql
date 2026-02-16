-- =============================================================================
-- SETUP_CLEAN.sql - Limpieza y configuración completa de Supabase
-- =============================================================================
-- Este script:
-- 1. Elimina tablas duplicadas/innecesarias
-- 2. Ejecuta la migración oficial de user_profiles
-- 3. Crea perfiles para usuarios existentes
-- 4. Promueve el primer usuario a admin
-- =============================================================================

-- ============================================
-- PASO 1: LIMPIAR TABLAS DUPLICADAS
-- ============================================
-- Las tablas 'roles' y 'user_roles' NO se usan en este proyecto
-- El sistema simplificado usa solo user_profiles.role

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ============================================
-- PASO 2: ELIMINAR POLÍTICAS Y TRIGGERS ANTIGUOS
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;

-- ============================================
-- PASO 3: CREAR TABLA user_profiles (SI NO EXISTE)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PASO 4: CREAR ÍNDICES
-- ============================================
DROP INDEX IF EXISTS idx_user_profiles_role;
DROP INDEX IF EXISTS idx_user_profiles_email;

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

-- ============================================
-- PASO 5: HABILITAR RLS
-- ============================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 6: CREAR POLÍTICAS RLS
-- ============================================

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden actualizar su propio perfil (pero no el rol)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- PASO 7: FUNCIÓN PARA AUTO-CREAR PERFIL
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 8: TRIGGER PARA NUEVOS USUARIOS
-- ============================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PASO 9: FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 10: TRIGGER PARA updated_at
-- ============================================
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- PASO 11: FUNCIÓN is_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 12: FUNCIÓN set_user_role
-- ============================================
CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Validar rol
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin';
  END IF;

  -- Actualizar rol
  UPDATE public.user_profiles
  SET role = new_role
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 13: CREAR PERFILES PARA USUARIOS EXISTENTES
-- ============================================
-- Esto crea perfiles para usuarios que ya existen en auth.users
-- pero no tienen perfil en user_profiles
INSERT INTO public.user_profiles (user_id, email, display_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
  'user'
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PASO 14: PROMOVER PRIMER USUARIO A ADMIN
-- ============================================
-- Actualiza el email si es diferente
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'ealonsov@gmail.com';

-- ============================================
-- PASO 15: VERIFICACIÓN FINAL
-- ============================================
-- Mostrar el resultado
SELECT
  '✅ SETUP COMPLETADO' as status,
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
  COUNT(*) FILTER (WHERE role = 'user') as total_users
FROM public.user_profiles;

-- Mostrar detalles de perfiles
SELECT
  user_id,
  email,
  display_name,
  role,
  is_active,
  created_at
FROM public.user_profiles
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'user' THEN 2
  END,
  created_at;
