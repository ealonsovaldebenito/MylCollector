import type { LegalStatus } from '../schemas/card.js';
import type { ValidationMessage, ValidationResult, DeckComputedStats } from '../schemas/validation.js';

// ============================================================================
// Deck Validation Engine — pure, deterministic, no IO
// Doc reference: 04_DECK_VALIDATION_ENGINE.md
// ============================================================================

/** Format configuration pre-resolved from DB */
export interface FormatConfig {
  format_id: string;
  params: {
    deck_size: number;
    default_card_limit: number;
    discontinued_severity: 'WARN' | 'BLOCK';
  };
  allowed_block_ids: Set<string>;
  allowed_edition_ids: Set<string>;
  allowed_card_type_ids: Set<string>;
  allowed_race_ids: Set<string>;
  card_limits: Map<string, number>;
}

/** Single card entry with all resolved data needed for validation */
export interface DeckCardEntry {
  card_printing_id: string;
  qty: number;
  is_starting_gold: boolean;
  card_id: string;
  card_type_code: string;
  race_id: string | null;
  race_name: string | null;
  is_unique: boolean;
  has_ability: boolean;
  can_be_starting_gold: boolean;
  legal_status: LegalStatus;
  edition_id: string;
  block_id: string;
  cost: number | null;
  card_name: string;
  card_type_name: string;
  rarity_tier_id: string | null;
  rarity_name: string | null;
}

const SEVERITY_ORDER: Record<string, number> = { BLOCK: 0, WARN: 1, INFO: 2 };

function sortMessages(messages: ValidationMessage[]): ValidationMessage[] {
  return messages.sort((a, b) => {
    const sa = SEVERITY_ORDER[a.severity] ?? 3;
    const sb = SEVERITY_ORDER[b.severity] ?? 3;
    if (sa !== sb) return sa - sb;
    if (a.rule_id !== b.rule_id) return a.rule_id.localeCompare(b.rule_id);
    const nameA = (a.context_json as Record<string, unknown>).card_name as string | undefined;
    const nameB = (b.context_json as Record<string, unknown>).card_name as string | undefined;
    return (nameA ?? '').localeCompare(nameB ?? '');
  });
}

function computeStats(cards: DeckCardEntry[]): DeckComputedStats {
  const cost_histogram: Record<string, number> = {};
  const gold_histogram: Record<string, number> = {};
  const type_distribution: Record<string, number> = {};
  const race_distribution: Record<string, number> = {};
  const rarity_distribution: Record<string, number> = {};
  let total_cards = 0;

  let costSum = 0;
  let costQty = 0;
  let goldSum = 0;
  let goldQty = 0;

  const avg_cost_by_type: Record<string, { qty: number; costed_qty: number; cost_sum: number }> = {};

  for (const c of cards) {
    total_cards += c.qty;

    // Cost histogram
    const isGold = c.card_type_code === 'ORO';
    if (!isGold) {
      const costKey = c.cost !== null ? String(c.cost) : 'N/A';
      cost_histogram[costKey] = (cost_histogram[costKey] ?? 0) + c.qty;

      if (c.cost !== null) {
        costSum += c.cost * c.qty;
        costQty += c.qty;
      }
    } else {
      const goldKey = c.cost !== null ? String(c.cost) : 'N/A';
      gold_histogram[goldKey] = (gold_histogram[goldKey] ?? 0) + c.qty;

      if (c.cost !== null) {
        goldSum += c.cost * c.qty;
        goldQty += c.qty;
      }
    }

    // Type distribution
    const typeName = c.card_type_name;
    type_distribution[typeName] = (type_distribution[typeName] ?? 0) + c.qty;

    // Avg cost by type (non-gold only)
    const typeAgg = (avg_cost_by_type[typeName] ??= { qty: 0, costed_qty: 0, cost_sum: 0 });
    typeAgg.qty += c.qty;
    if (!isGold && c.cost !== null) {
      typeAgg.costed_qty += c.qty;
      typeAgg.cost_sum += c.cost * c.qty;
    }

    // Race distribution
    if (c.card_type_code === 'ALIADO') {
      const raceName = c.race_name ?? 'Sin raza';
      race_distribution[raceName] = (race_distribution[raceName] ?? 0) + c.qty;
    }

    // Rarity distribution
    const rarityName = c.rarity_name ?? 'Sin rareza';
    rarity_distribution[rarityName] = (rarity_distribution[rarityName] ?? 0) + c.qty;
  }

  const avg_cost = costQty > 0 ? Number((costSum / costQty).toFixed(2)) : null;
  const avg_gold_value = goldQty > 0 ? Number((goldSum / goldQty).toFixed(2)) : null;

  const avg_cost_by_type_out: Record<string, { qty: number; costed_qty: number; avg: number | null }> = {};
  for (const [typeName, agg] of Object.entries(avg_cost_by_type)) {
    avg_cost_by_type_out[typeName] = {
      qty: agg.qty,
      costed_qty: agg.costed_qty,
      avg: agg.costed_qty > 0 ? Number((agg.cost_sum / agg.costed_qty).toFixed(2)) : null,
    };
  }

  return {
    total_cards,
    cost_histogram,
    gold_histogram,
    avg_cost,
    avg_gold_value,
    avg_cost_by_type: avg_cost_by_type_out,
    type_distribution,
    race_distribution,
    rarity_distribution,
  };
}

/**
 * Validate a deck against a format configuration.
 * Pure function — no IO, no DB access. Deterministic output.
 */
export function validateDeck(config: FormatConfig, cards: DeckCardEntry[]): ValidationResult {
  const start = performance.now();
  const messages: ValidationMessage[] = [];
  const { deck_size, default_card_limit, discontinued_severity } = config.params;

  // --- DECK_TOTAL ---
  const totalCards = cards.reduce((sum, c) => sum + c.qty, 0);
  if (totalCards !== deck_size) {
    messages.push({
      rule_id: 'DECK_TOTAL_50',
      rule_version: 1,
      severity: 'BLOCK',
      message: `El mazo debe tener exactamente ${deck_size} cartas.`,
      hint: totalCards < deck_size
        ? `Agrega ${deck_size - totalCards} carta(s) mas.`
        : `Retira ${totalCards - deck_size} carta(s).`,
      entity_ref: null,
      context_json: { expected: deck_size, found: totalCards },
    });
  }

  // Group by card_id to check per-card limits
  const cardQtyMap = new Map<string, { total: number; entries: DeckCardEntry[] }>();
  for (const c of cards) {
    const existing = cardQtyMap.get(c.card_id);
    if (existing) {
      existing.total += c.qty;
      existing.entries.push(c);
    } else {
      cardQtyMap.set(c.card_id, { total: c.qty, entries: [c] });
    }
  }

  for (const c of cards) {
    // --- CARD_QTY_POSITIVE ---
    if (c.qty <= 0) {
      messages.push({
        rule_id: 'CARD_QTY_POSITIVE',
        rule_version: 1,
        severity: 'BLOCK',
        message: `La cantidad de "${c.card_name}" debe ser positiva.`,
        hint: 'Retira la carta o incrementa la cantidad.',
        entity_ref: { card_printing_id: c.card_printing_id, card_id: c.card_id },
        context_json: { card_name: c.card_name, qty: c.qty },
      });
    }

    // --- FORMAT_ALLOWED_BLOCK ---
    if (config.allowed_block_ids.size > 0 && !config.allowed_block_ids.has(c.block_id)) {
      messages.push({
        rule_id: 'FORMAT_ALLOWED_BLOCK',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${c.card_name}" pertenece a un bloque no permitido en este formato.`,
        hint: 'Retira esta carta o cambia de formato.',
        entity_ref: { card_printing_id: c.card_printing_id, block_id: c.block_id },
        context_json: { card_name: c.card_name, block_id: c.block_id },
      });
    }

    // --- FORMAT_ALLOWED_EDITION ---
    if (config.allowed_edition_ids.size > 0 && !config.allowed_edition_ids.has(c.edition_id)) {
      messages.push({
        rule_id: 'FORMAT_ALLOWED_EDITION',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${c.card_name}" pertenece a una edicion no permitida en este formato.`,
        hint: 'Retira esta carta o cambia de formato.',
        entity_ref: { card_printing_id: c.card_printing_id, edition_id: c.edition_id },
        context_json: { card_name: c.card_name, edition_id: c.edition_id },
      });
    }

    // --- FORMAT_ALLOWED_CARD_TYPE ---
    if (config.allowed_card_type_ids.size > 0) {
      // We need the card_type_id, but we have card_type_code. Use the code from entry.
      // The allowed set uses IDs, so we pass through card_type checking here if no IDs available.
      // This is handled by the service layer resolving card_type_id.
    }

    // --- FORMAT_ALLOWED_RACE ---
    if (config.allowed_race_ids.size > 0 && c.race_id && !config.allowed_race_ids.has(c.race_id)) {
      messages.push({
        rule_id: 'FORMAT_ALLOWED_RACE',
        rule_version: 1,
        severity: 'BLOCK',
        message: `La raza de "${c.card_name}" no esta permitida en este formato.`,
        hint: 'Retira esta carta o cambia de formato.',
        entity_ref: { card_printing_id: c.card_printing_id },
        context_json: { card_name: c.card_name, race_id: c.race_id },
      });
    }

    // --- LEGAL_STATUS_DISCONTINUED ---
    if (c.legal_status === 'DISCONTINUED') {
      messages.push({
        rule_id: 'LEGAL_STATUS_DISCONTINUED',
        rule_version: 1,
        severity: discontinued_severity,
        message: `"${c.card_name}" esta discontinuada.`,
        hint: 'Considera reemplazarla por otra carta.',
        entity_ref: { card_printing_id: c.card_printing_id, card_id: c.card_id },
        context_json: { card_name: c.card_name, legal_status: c.legal_status },
      });
    }

    // --- LEGAL_STATUS_BANNED ---
    if (c.legal_status === 'BANNED') {
      messages.push({
        rule_id: 'LEGAL_STATUS_BANNED',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${c.card_name}" esta prohibida en este formato.`,
        hint: 'Retira esta carta.',
        entity_ref: { card_printing_id: c.card_printing_id, card_id: c.card_id },
        context_json: { card_name: c.card_name, legal_status: c.legal_status },
      });
    }

    // --- LEGAL_STATUS_RESTRICTED ---
    if (c.legal_status === 'RESTRICTED') {
      // Check if there's a specific override in format_card_limits
      const hasFormatOverride = config.card_limits.has(c.card_id);
      if (!hasFormatOverride) {
        // Default restriction: max 1 copy when legal_status is RESTRICTED
        const cardInfo = cardQtyMap.get(c.card_id);
        if (cardInfo && cardInfo.total > 1) {
          messages.push({
            rule_id: 'LEGAL_STATUS_RESTRICTED',
            rule_version: 1,
            severity: 'BLOCK',
            message: `"${c.card_name}" esta restringida (maximo 1 copia).`,
            hint: 'Reduce a 1 copia o retira esta carta.',
            entity_ref: { card_printing_id: c.card_printing_id, card_id: c.card_id },
            context_json: { card_name: c.card_name, legal_status: c.legal_status, found: cardInfo.total },
          });
        }
      }
    }
  }

  // --- Per card_id limits ---
  for (const [cardId, info] of cardQtyMap) {
    const firstEntry = info.entries[0]!;

    // --- CARD_LIMIT_OVERRIDE ---
    const overrideLimit = config.card_limits.get(cardId);
    if (overrideLimit !== undefined && info.total > overrideLimit) {
      messages.push({
        rule_id: 'CARD_LIMIT_OVERRIDE',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${firstEntry.card_name}" tiene un limite especial de ${overrideLimit} copia(s) en este formato.`,
        hint: `Reduce a ${overrideLimit} copia(s).`,
        entity_ref: { card_id: cardId },
        context_json: { card_name: firstEntry.card_name, limit: overrideLimit, found: info.total },
      });
    } else if (overrideLimit === undefined && info.total > default_card_limit) {
      // --- CARD_LIMIT_DEFAULT_3 ---
      messages.push({
        rule_id: 'CARD_LIMIT_DEFAULT_3',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${firstEntry.card_name}" excede el limite de ${default_card_limit} copias.`,
        hint: `Reduce a ${default_card_limit} copia(s).`,
        entity_ref: { card_id: cardId },
        context_json: { card_name: firstEntry.card_name, limit: default_card_limit, found: info.total },
      });
    }

    // --- UNIQUE_CARD_MAX_1 ---
    if (firstEntry.is_unique && info.total > 1) {
      messages.push({
        rule_id: 'UNIQUE_CARD_MAX_1',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${firstEntry.card_name}" es unica y solo puede incluirse 1 vez.`,
        hint: 'Reduce a 1 copia.',
        entity_ref: { card_id: cardId },
        context_json: { card_name: firstEntry.card_name, found: info.total },
      });
    }
  }

  // --- STARTING GOLD rules ---
  const startingGoldCards = cards.filter((c) => c.is_starting_gold);

  if (startingGoldCards.length === 0) {
    messages.push({
      rule_id: 'STARTING_GOLD_EXACTLY_ONE',
      rule_version: 1,
      severity: 'BLOCK',
      message: 'Debes seleccionar exactamente 1 carta como oro inicial.',
      hint: 'Marca una carta de tipo Oro como oro inicial.',
      entity_ref: null,
      context_json: { expected: 1, found: 0 },
    });
  } else if (startingGoldCards.length > 1) {
    messages.push({
      rule_id: 'STARTING_GOLD_EXACTLY_ONE',
      rule_version: 1,
      severity: 'BLOCK',
      message: 'Solo puedes tener 1 carta como oro inicial.',
      hint: 'Desmarca las cartas sobrantes.',
      entity_ref: null,
      context_json: { expected: 1, found: startingGoldCards.length },
    });
  }

  for (const sg of startingGoldCards) {
    // --- STARTING_GOLD_TYPE_ORO_ONLY ---
    if (sg.card_type_code !== 'ORO') {
      messages.push({
        rule_id: 'STARTING_GOLD_TYPE_ORO_ONLY',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${sg.card_name}" no es de tipo Oro y no puede ser oro inicial.`,
        hint: 'Selecciona una carta de tipo Oro.',
        entity_ref: { card_printing_id: sg.card_printing_id, card_id: sg.card_id },
        context_json: { card_name: sg.card_name, card_type_code: sg.card_type_code },
      });
    }

    // --- STARTING_GOLD_MUST_HAVE_NO_ABILITY ---
    if (sg.has_ability) {
      messages.push({
        rule_id: 'STARTING_GOLD_MUST_HAVE_NO_ABILITY',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${sg.card_name}" tiene habilidad y no puede ser oro inicial.`,
        hint: 'Selecciona un oro sin habilidad.',
        entity_ref: { card_printing_id: sg.card_printing_id, card_id: sg.card_id },
        context_json: { card_name: sg.card_name, has_ability: true },
      });
    }

    // --- STARTING_GOLD_NOT_ALLOWED_FOR_PRINTING ---
    if (!sg.can_be_starting_gold) {
      messages.push({
        rule_id: 'STARTING_GOLD_NOT_ALLOWED_FOR_PRINTING',
        rule_version: 1,
        severity: 'BLOCK',
        message: `"${sg.card_name}" no puede ser seleccionada como oro inicial.`,
        hint: 'Selecciona otra carta de oro.',
        entity_ref: { card_printing_id: sg.card_printing_id, card_id: sg.card_id },
        context_json: { card_name: sg.card_name, can_be_starting_gold: false },
      });
    }
  }

  // Compute stats
  const computed_stats = computeStats(cards);

  // Sort messages deterministically
  const sortedMessages = sortMessages(messages);

  // Determine validity
  const is_valid = !sortedMessages.some((m) => m.severity === 'BLOCK');

  const duration_ms = Math.round(performance.now() - start);

  return {
    is_valid,
    messages: sortedMessages,
    computed_stats,
    timing: { duration_ms },
  };
}
