-- Migration: Card deck stats RPC
-- Context: Catalog UI requiere estadisticas agregadas por carta.
-- Description: RPC para contar mazos publicos que incluyen una carta y calcular co-ocurrencias (Top companions).
-- Relations: public_decks -> public_deck_cards -> card_printings -> cards
-- Changelog:
--   - 2026-02-17: Add `card_deck_stats(target_card_id, top_n)` RPC for catalog card statistics.

CREATE OR REPLACE FUNCTION card_deck_stats(target_card_id uuid, top_n int DEFAULT 10)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  WITH containing_decks AS (
    SELECT DISTINCT pdc.public_deck_id
    FROM public_deck_cards pdc
    JOIN card_printings cp ON cp.card_printing_id = pdc.card_printing_id
    WHERE cp.card_id = target_card_id
  ),
  companions AS (
    SELECT
      cp2.card_id,
      c.name,
      MIN(cp2.image_url) FILTER (WHERE cp2.image_url IS NOT NULL) AS image_url,
      COUNT(DISTINCT pdc2.public_deck_id)::int AS decks_with,
      SUM(pdc2.qty)::int AS total_qty
    FROM public_deck_cards pdc2
    JOIN containing_decks cd ON cd.public_deck_id = pdc2.public_deck_id
    JOIN card_printings cp2 ON cp2.card_printing_id = pdc2.card_printing_id
    JOIN cards c ON c.card_id = cp2.card_id
    WHERE cp2.card_id <> target_card_id
    GROUP BY cp2.card_id, c.name
    ORDER BY decks_with DESC, total_qty DESC, c.name ASC
    LIMIT top_n
  )
  SELECT jsonb_build_object(
    'deck_count', (SELECT COUNT(*)::int FROM containing_decks),
    'top_companions', COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'card_id', card_id,
            'name', name,
            'image_url', image_url,
            'decks_with', decks_with,
            'total_qty', total_qty
          )
        )
        FROM companions
      ),
      '[]'::jsonb
    )
  );
$$;

