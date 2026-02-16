import { describe, it, expect } from 'vitest';
import {
  cardBaseSchema,
  legalStatusSchema,
  cardFiltersSchema,
  createCardSchema,
  createCardPrintingSchema,
} from '../index.js';

describe('legalStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(legalStatusSchema.parse('LEGAL')).toBe('LEGAL');
    expect(legalStatusSchema.parse('RESTRICTED')).toBe('RESTRICTED');
    expect(legalStatusSchema.parse('BANNED')).toBe('BANNED');
    expect(legalStatusSchema.parse('DISCONTINUED')).toBe('DISCONTINUED');
  });

  it('rejects invalid status', () => {
    expect(() => legalStatusSchema.parse('INVALID')).toThrow();
  });
});

describe('cardBaseSchema', () => {
  const validCard = {
    card_id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Guerrero de Fuego',
    name_normalized: 'guerrero de fuego',
    card_type_id: '550e8400-e29b-41d4-a716-446655440001',
    race_id: '550e8400-e29b-41d4-a716-446655440002',
    ally_strength: 5,
    cost: 3,
    is_unique: false,
    has_ability: true,
    can_be_starting_gold: false,
    text: 'Inflige 3 puntos de daño',
    flavor_text: 'El fuego consume todo',
  };

  it('validates a correct card', () => {
    const result = cardBaseSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it('accepts null race_id and ally_strength', () => {
    const card = { ...validCard, race_id: null, ally_strength: null };
    const result = cardBaseSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('rejects negative ally_strength', () => {
    const card = { ...validCard, ally_strength: -1 };
    const result = cardBaseSchema.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const { name: _, ...card } = validCard;
    const result = cardBaseSchema.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for card_id', () => {
    const card = { ...validCard, card_id: 'not-a-uuid' };
    const result = cardBaseSchema.safeParse(card);
    expect(result.success).toBe(false);
  });
});

describe('cardFiltersSchema', () => {
  it('parses empty params with defaults', () => {
    const result = cardFiltersSchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.q).toBeUndefined();
    expect(result.cursor).toBeUndefined();
  });

  it('parses string number params', () => {
    const result = cardFiltersSchema.parse({
      cost_min: '1',
      cost_max: '5',
      limit: '20',
    });
    expect(result.cost_min).toBe(1);
    expect(result.cost_max).toBe(5);
    expect(result.limit).toBe(20);
  });

  it('parses all filter fields', () => {
    const result = cardFiltersSchema.parse({
      q: 'dragon',
      block_id: '550e8400-e29b-41d4-a716-446655440000',
      edition_id: '550e8400-e29b-41d4-a716-446655440001',
      card_type_id: '550e8400-e29b-41d4-a716-446655440002',
      race_id: '550e8400-e29b-41d4-a716-446655440003',
      rarity_tier_id: '550e8400-e29b-41d4-a716-446655440004',
      legal_status: 'LEGAL',
      cost_min: '0',
      cost_max: '10',
      limit: '100',
      cursor: 'abc123',
    });
    expect(result.q).toBe('dragon');
    expect(result.legal_status).toBe('LEGAL');
    expect(result.limit).toBe(100);
  });

  it('rejects invalid legal_status', () => {
    const result = cardFiltersSchema.safeParse({ legal_status: 'INVALID' });
    expect(result.success).toBe(false);
  });
});

describe('createCardSchema', () => {
  it('validates minimal card creation', () => {
    const result = createCardSchema.safeParse({
      name: 'Mi Carta',
      card_type_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_unique).toBe(false);
      expect(result.data.has_ability).toBe(false);
      expect(result.data.tag_ids).toEqual([]);
    }
  });

  it('validates full card creation', () => {
    const result = createCardSchema.safeParse({
      name: 'Dragon Ancestral',
      card_type_id: '550e8400-e29b-41d4-a716-446655440000',
      race_id: '550e8400-e29b-41d4-a716-446655440001',
      ally_strength: 8,
      cost: 5,
      is_unique: true,
      has_ability: true,
      can_be_starting_gold: false,
      text: 'Cuando entra al campo, roba 2 cartas',
      flavor_text: 'El ultimo de su especie',
      tag_ids: ['550e8400-e29b-41d4-a716-446655440010'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createCardSchema.safeParse({
      name: '',
      card_type_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing card_type_id', () => {
    const result = createCardSchema.safeParse({ name: 'Carta' });
    expect(result.success).toBe(false);
  });
});

describe('createCardPrintingSchema', () => {
  it('validates minimal printing creation', () => {
    const result = createCardPrintingSchema.safeParse({
      card_id: '550e8400-e29b-41d4-a716-446655440000',
      edition_id: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.legal_status).toBe('LEGAL');
      expect(result.data.printing_variant).toBe('standard');
    }
  });

  it('rejects missing edition_id', () => {
    const result = createCardPrintingSchema.safeParse({
      card_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});
