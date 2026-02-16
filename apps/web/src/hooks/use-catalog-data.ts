'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Block, Edition, CardType, Race, RarityTier, Tag } from '@myl/shared';

interface CatalogData {
  blocks: Block[];
  editions: Edition[];
  cardTypes: CardType[];
  races: Race[];
  rarities: RarityTier[];
  tags: Tag[];
  isLoading: boolean;
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const json = await res.json();
  return json.ok ? json.data : [];
}

export function useCatalogData(): CatalogData {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [rarities, setRarities] = useState<RarityTier[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [b, e, ct, r, rt, t] = await Promise.all([
        fetchJson<Block>('/api/v1/catalog/blocks'),
        fetchJson<Edition>('/api/v1/catalog/editions'),
        fetchJson<CardType>('/api/v1/catalog/card-types'),
        fetchJson<Race>('/api/v1/catalog/races'),
        fetchJson<RarityTier>('/api/v1/catalog/rarities'),
        fetchJson<Tag>('/api/v1/catalog/tags'),
      ]);
      setBlocks(b);
      setEditions(e);
      setCardTypes(ct);
      setRaces(r);
      setRarities(rt);
      setTags(t);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { blocks, editions, cardTypes, races, rarities, tags, isLoading };
}
