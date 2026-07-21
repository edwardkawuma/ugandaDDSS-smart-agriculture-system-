import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ActiveLayerState, GeeLayerDefinition } from '@/lib/geospatial/types';
import { CloudRain, Layers, Leaf, Sprout } from 'lucide-react';

const LAYER_ICONS: Record<string, typeof Layers> = {
  'crop-distribution': Sprout,
  'soil-quality': Leaf,
  rainfall: CloudRain,
  ndvi: Leaf,
};

interface MapLayerControlPanelProps {
  layers: GeeLayerDefinition[];
  activeLayers: ActiveLayerState[];
  mode: 'gee' | 'demo';
  onToggle: (id: ActiveLayerState['id']) => void;
  onReset: () => void;
  className?: string;
}

export function MapLayerControlPanel({
  layers,
  activeLayers,
  mode,
  onToggle,
  onReset,
  className,
}: MapLayerControlPanelProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Layers className="h-4 w-4 text-primary" />
          Earth Engine Layers
        </span>
        <Badge variant="outline" className="border-border/40 bg-background/40 text-[10px]">
          {mode === 'gee' ? 'Live GEE' : 'Demo mode'}
        </Badge>
      </div>

      {layers.map((layer) => {
        const Icon = LAYER_ICONS[layer.id] ?? Layers;
        const active = activeLayers.find((l) => l.id === layer.id);
        const checked = active?.visible ?? false;
        return (
          <div
            key={layer.id}
            className={cn(
              'flex items-start justify-between gap-2 border-b border-border/30 px-1.5 py-2.5 transition-colors',
              checked ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                <span
                  className={cn(
                    'inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset',
                    checked ? 'bg-primary ring-primary/80' : 'bg-muted-foreground/30 ring-border/60',
                  )}
                />
                <Icon className={cn('h-4 w-4 shrink-0', checked ? 'text-primary' : 'text-muted-foreground')} />
                {layer.name}
              </span>
              <p className="mt-0.5 text-xs text-muted-foreground">{layer.description}</p>
            </div>
            <Switch checked={checked} onCheckedChange={() => onToggle(layer.id)} aria-label={layer.name} />
          </div>
        );
      })}

      <Separator />

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-md border border-border/40 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
      >
        Reset layers
      </button>

      {layers[0]?.legend && (
        <div className="rounded-lg border border-border/40 bg-background/50 p-2">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Legend</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {(layers.find((l) => activeLayers.find((a) => a.id === l.id)?.visible)?.legend ?? layers[0].legend).map(
              (item) => (
                <span key={item.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
