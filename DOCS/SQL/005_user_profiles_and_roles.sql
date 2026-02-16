-- =============================================================================
-- 005_user_profiles_and_roles.sql
-- User profiles and role management system
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
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

-- Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile (but not role)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user'  -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.user_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = check_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote user to admin (only callable by existing admin)
CREATE OR REPLACE FUNCTION public.set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  -- Validate role
  IF new_role NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Must be user or admin';
  END IF;

  -- Update role
  UPDATE public.user_profiles
  SET role = new_role
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert first admin (REPLACE WITH YOUR EMAIL)
-- You need to signup first, then run this:
-- UPDATE public.user_profiles SET role = 'admin' WHERE email = 'your-email@example.com';

COMMENT ON TABLE public.user_profiles IS 'User profile information and roles';
COMMENT ON FUNCTION public.is_admin IS 'Check if a user has admin role';
COMMENT ON FUNCTION public.set_user_role IS 'Set user role (admin only)';
