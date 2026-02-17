-- Migration: user_cards — garantizar columnas condition (TEXT) + acquired_at
-- Idempotente: seguro de correr múltiples veces.

-- 1. Agregar columna condition TEXT si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_cards' AND column_name = 'condition'
  ) THEN
    ALTER TABLE public.user_cards ADD COLUMN condition TEXT NOT NULL DEFAULT 'PERFECTA';
    RAISE NOTICE 'Columna condition agregada';
  ELSE
    RAISE NOTICE 'Columna condition ya existe';
  END IF;
END $$;

-- 2. Si condition_id aún existe, migrar datos y luego dropear
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_cards' AND column_name = 'condition_id'
  ) THEN
    -- Migrar datos existentes
    UPDATE public.user_cards uc
    SET condition = COALESCE(cc.code, 'PERFECTA')
    FROM public.card_conditions cc
    WHERE uc.condition_id = cc.condition_id
      AND uc.condition_id IS NOT NULL;

    -- Dropear constraint viejo si existe
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND constraint_name = 'uq_user_card_printing_condition' AND table_name = 'user_cards'
    ) THEN
      ALTER TABLE public.user_cards DROP CONSTRAINT uq_user_card_printing_condition;
      RAISE NOTICE 'Constraint viejo dropeado';
    END IF;

    -- Dropear columna condition_id
    ALTER TABLE public.user_cards DROP COLUMN condition_id;
    RAISE NOTICE 'Columna condition_id dropeada';
  ELSE
    RAISE NOTICE 'Columna condition_id ya no existe';
  END IF;
END $$;

-- 3. Agregar columna acquired_at si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_cards' AND column_name = 'acquired_at'
  ) THEN
    ALTER TABLE public.user_cards ADD COLUMN acquired_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Columna acquired_at agregada';
  ELSE
    RAISE NOTICE 'Columna acquired_at ya existe';
  END IF;
END $$;

-- 4. Unique constraint (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND constraint_name = 'uq_user_card_printing_condition' AND table_name = 'user_cards'
  ) THEN
    ALTER TABLE public.user_cards
      ADD CONSTRAINT uq_user_card_printing_condition
      UNIQUE (user_id, card_printing_id, condition);
    RAISE NOTICE 'Unique constraint creado';
  ELSE
    RAISE NOTICE 'Unique constraint ya existe';
  END IF;
END $$;

-- 5. Check constraint (idempotente / actualizable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND constraint_name = 'chk_user_cards_condition' AND table_name = 'user_cards'
  ) THEN
    ALTER TABLE public.user_cards DROP CONSTRAINT chk_user_cards_condition;
    RAISE NOTICE 'Check constraint antiguo eliminado';
  END IF;

  ALTER TABLE public.user_cards
    ADD CONSTRAINT chk_user_cards_condition
    CHECK (condition IN (
      'PERFECTA',
      'CASI PERFECTA',
      'EXCELENTE',
      'BUENA',
      'POCO USO',
      'JUGADA',
      'MALAS CONDICIONES'
    ));
  RAISE NOTICE 'Check constraint actualizado';
END $$;

-- 6. Diagnóstico final — muestra columnas actuales de user_cards
DO $$
DECLARE
  col RECORD;
BEGIN
  RAISE NOTICE '--- Columnas de user_cards ---';
  FOR col IN
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_cards'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE '%  %  nullable=%  default=%', col.column_name, col.data_type, col.is_nullable, col.column_default;
  END LOOP;
END $$;
