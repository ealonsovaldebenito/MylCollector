'use client';

import { useEffect, useState } from 'react';

interface Edition {
  edition_id: string;
  name: string;
  code: string;
  block_id: string;
}

interface Race {
  race_id: string;
  name: string;
  code: string;
}

/**
 * Hook para obtener ediciones del catálogo
 */
export function useEditions() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const res = await fetch('/api/v1/catalog/editions');
        const json = await res.json();
        if (json.ok) {
          setEditions(json.data);
        } else {
          setError(json.error?.message ?? 'Error al cargar ediciones');
        }
      } catch {
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEditions();
  }, []);

  return { editions, isLoading, error };
}

/**
 * Hook para obtener razas del catálogo
 */
export function useRaces() {
  const [races, setRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        const res = await fetch('/api/v1/catalog/races');
        const json = await res.json();
        if (json.ok) {
          setRaces(json.data);
        } else {
          setError(json.error?.message ?? 'Error al cargar razas');
        }
      } catch {
        setError('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRaces();
  }, []);

  return { races, isLoading, error };
}
