'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormatItem {
  format_id: string;
  name: string;
  code: string;
  description: string | null;
}

interface FormatSelectorProps {
  formats: FormatItem[];
  value: string;
  onChange: (formatId: string) => void;
  disabled?: boolean;
}

export function FormatSelector({ formats, value, onChange, disabled }: FormatSelectorProps) {
  if (formats.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="text-xs">
        Sin formatos
      </Button>
    );
  }

  return (
    <Select value={value || '__none__'} onValueChange={(v) => onChange(v === '__none__' ? '' : v)} disabled={disabled}>
      <SelectTrigger className="h-8 w-[180px] text-xs">
        <SelectValue placeholder="Seleccionar formato" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__" disabled>
          Seleccionar formato
        </SelectItem>
        {formats.map((f) => (
          <SelectItem key={f.format_id} value={f.format_id}>
            <div className="flex flex-col">
              <span>{f.name}</span>
              {f.description && (
                <span className="text-[10px] text-muted-foreground">{f.description}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
