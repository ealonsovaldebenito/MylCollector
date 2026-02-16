'use client';

import { useEffect, useState } from 'react';

interface FormatItem {
  format_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  params_json: Record<string, unknown>;
}

interface UseFormatsResult {
  formats: FormatItem[];
  isLoading: boolean;
  error: string | null;
}

export function useFormats(): UseFormatsResult {
  const [formats, setFormats] = useState<FormatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/formats');
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Error al cargar formatos');
          return;
        }
        setFormats(json.data.items);
      } catch {
        setError('Error de conexion');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return { formats, isLoading, error };
}
