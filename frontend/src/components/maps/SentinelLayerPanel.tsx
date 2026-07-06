/**
 * SentinelLayerPanel — collapsible layer-toggle panel for Sentinel Hub WMS layers.
 * Groups layers by category: Vegetation, Moisture, Agriculture, Composite.
 */
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Layers, Leaf, Droplets, Tractor, Eye,
} from 'lucide-react';
import {
  SENTINEL_LAYERS,
  type SentinelLayerId,
  type SentinelLayerDef,
} from '@/lib/geospatial/sentinelHub';

export type ActiveSentinelLayer = {
  id: SentinelLayerId;
  visible: boolean;
  opacity: number;
};

interface SentinelLayerPanelProps {
  activeLayers: ActiveSentinelLayer[];
  onToggle: (id: SentinelLayerId) => void;
  onOpacityChange?: (id: SentinelLayerId, opacity: number) => void;
  className?: string;
}

const GROUP_META: Record<SentinelLayerDef['group'], { label: string; icon: typeof Layers }> = {
  vegetation:  { label: 'Vegetation Indices', icon: Leaf },
  moisture:    { label: 'Moisture & Stress',  icon: Droplets },
  agriculture: { label: 'Agriculture',        icon: Tractor },
  composite:   { label: 'Composite Views',    icon: Eye },
};

const GROUP_ORDER: SentinelLayerDef['group'][] = ['composite', 'vegetation', 'moisture', 'agriculture'];

export function SentinelLayerPanel({
  activeLayers,
  onToggle,
  className,
}: SentinelLayerPanelProps) {
  const isActive = (id: SentinelLayerId) =>
    activeLayers.find(l => l.id === id)?.visible ?? false;

  const activeCount = activeLayers.filter(l => l.visible).length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4 text-primary" />
          Sentinel Hub Layers
        </span>
        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
          {activeCount} active
        </Badge>
      </div>

      {/* Layer groups */}
      {GROUP_ORDER.map(group => {
        const { label, icon: Icon } = GROUP_META[group];
        const groupLayers = SENTINEL_LAYERS.filter(l => l.group === group);
        return (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              <Icon className="h-3 w-3" />
              {label}
            </div>
            {groupLayers.map(layer => {
              const active = isActive(layer.id);
              return (
                <div
                  key={layer.id}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 transition-all cursor-pointer',
                    active
                      ? 'border-primary/50 bg-primary/8'
                      : 'border-border/40 bg-card/40 hover:border-border/60',
                  )}
                  onClick={() => onToggle(layer.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{layer.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                        {layer.description}
                      </p>
                    </div>
                    <Switch
                      checked={active}
                      onCheckedChange={() => onToggle(layer.id)}
                      aria-label={layer.name}
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 mt-0.5"
                    />
                  </div>

                  {/* Colour legend */}
                  {active && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {layer.legend.map(item => (
                        <span key={item.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Separator className="opacity-30" />
          </div>
        );
      })}

      <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
        Imagery © <a href="https://www.sentinel-hub.com" target="_blank" rel="noreferrer" className="underline">Sentinel Hub</a> ·
        Copernicus Sentinel-2 · Clipped to Uganda
      </p>
    </div>
  );
}
