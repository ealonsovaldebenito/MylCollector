'use client';

import { cn } from '@/lib/utils';
import { editionDisplayName } from '@myl/shared';
import { Badge } from '@/components/ui/badge';
import { CardImage } from './card-image';
import { Shield, ShieldAlert, ShieldOff, ShieldX, Heart } from 'lucide-react';

interface CardTileProps {
  name: string;
  imageUrl: string | null;
  typeName: string;
  typeCode: string;
  editionName: string;
  rarityName: string | null;
  rarityCode: string | null;
  legalStatus: string;
  cost: number | null;
  allyStrength: number | null;
  storeMinPrice: number | null;
  tags?: { tag_id: string; name: string; slug: string }[];
  onClick?: () => void;
  size?: 'normal' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

const LEGAL_STATUS_CONFIG: Record<string, { icon: typeof Shield; className: string }> = {
  LEGAL: { icon: Shield, className: 'text-green-500' },
  RESTRICTED: { icon: ShieldAlert, className: 'text-yellow-500' },
  BANNED: { icon: ShieldX, className: 'text-red-500' },
  DISCONTINUED: { icon: ShieldOff, className: 'text-muted-foreground' },
};

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300',
  POCO_COMUN: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
  RARA: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  ULTRA_RARA: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  SECRETA: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-700 dark:text-amber-300',
};

const RARITY_GLOW: Record<string, string> = {
  ULTRA_RARA: 'rarity-glow-ultra',
  SECRETA: 'rarity-glow-secreta',
};

function formatCLP(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(price);
}

export function CardTile({
  name,
  imageUrl,
  typeName,
  typeCode: _typeCode,
  editionName,
  rarityName,
  rarityCode,
  legalStatus,
  cost,
  allyStrength,
  storeMinPrice,
  tags,
  onClick,
  size = 'large',
  className,
  style,
}: CardTileProps) {
  const defaultLegal = { icon: Shield, className: 'text-green-500' };
  const legalConfig = LEGAL_STATUS_CONFIG[legalStatus] ?? defaultLegal;
  const LegalIcon = legalConfig.icon;
  const defaultRarity = 'bg-zinc-500/20 text-zinc-700 dark:text-zinc-300';
  const rarityColor = RARITY_COLORS[rarityCode ?? ''] ?? defaultRarity;
  const glowClass = RARITY_GLOW[rarityCode ?? ''] ?? '';

  const isLarge = size === 'large';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-border',
        'bg-card text-left transition-all duration-200',
        'hover:scale-[1.02] hover:border-accent/30 hover:shadow-xl',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'animate-fade-in',
        glowClass,
        className,
      )}
      style={style}
    >
      {/* Price badge — top right, always visible */}
      {storeMinPrice !== null && (
        <div className={cn(
          'absolute z-10',
          isLarge ? 'right-2 top-2' : 'right-1.5 top-1.5',
        )}>
          <Badge className={cn(
            'bg-green-600/90 font-mono font-semibold text-white backdrop-blur border-0 shadow-md',
            isLarge ? 'text-xs px-2 py-0.5' : 'text-[9px] px-1.5 py-0',
          )}>
            {formatCLP(storeMinPrice)}
          </Badge>
        </div>
      )}

      {/* Favorite button — visible on hover */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'absolute z-10 opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center justify-center rounded-full bg-black/50 backdrop-blur border border-white/20',
          'hover:bg-destructive/20 hover:border-destructive/40 transition-all cursor-pointer',
          isLarge ? 'left-2 top-2 h-8 w-8' : 'left-1.5 top-1.5 h-6 w-6',
        )}
        title="Agregar a favoritos"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
      >
        <Heart className={cn('text-white/80 hover:text-destructive transition-colors', isLarge ? 'h-4 w-4' : 'h-3 w-3')} />
      </div>

      {/* Card image */}
      <CardImage
        src={imageUrl}
        alt={name}
        className="aspect-[5/7] w-full"
      />

      {/* Overlay gradient */}
      <div className={cn(
        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent',
        isLarge ? 'p-4 pt-12' : 'p-2 pt-8'
      )}>
        {/* Legal status icon */}
        <div className={cn('absolute', isLarge ? 'right-3 top-3' : 'right-2 top-2')}>
          <LegalIcon className={cn(
            legalConfig.className,
            isLarge ? 'h-5 w-5' : 'h-3.5 w-3.5'
          )} />
        </div>

        {/* Card name */}
        <h3 className={cn(
          'font-display font-bold leading-tight text-white line-clamp-2',
          isLarge ? 'text-base' : 'text-xs'
        )}>
          {name}
        </h3>

        {/* Type + cost */}
        <div className={cn('flex items-center gap-1.5', isLarge ? 'mt-2' : 'mt-1')}>
          <span className={cn('text-white/70', isLarge ? 'text-sm' : 'text-[10px]')}>
            {typeName}
          </span>
          {cost !== null && (
            <Badge
              variant="secondary"
              className={cn('font-mono', isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]')}
            >
              {cost}
            </Badge>
          )}
          {allyStrength !== null && (
            <Badge
              variant="secondary"
              className={cn('font-mono', isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]')}
            >
              F:{allyStrength}
            </Badge>
          )}
        </div>

        {/* Edition + rarity */}
        <div className={cn('flex flex-wrap gap-1', isLarge ? 'mt-2' : 'mt-1')}>
          <Badge
            variant="outline"
            className={cn(
              'border-white/20 text-white/80',
              isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]'
            )}
          >
            {editionDisplayName(editionName)}
          </Badge>
          {rarityName && (
            <Badge className={cn(
              rarityColor,
              isLarge ? 'h-5 px-1.5 text-xs' : 'h-4 px-1 text-[10px]'
            )}>
              {rarityName}
            </Badge>
          )}
        </div>

        {/* Tags/Mechanics — only show in large size */}
        {isLarge && tags && tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag.tag_id}
                className="text-[10px] text-accent/80 font-medium"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
