/**
 * Uganda DDSS — Uganda Price Panel
 * Displays real-time UCDA coffee export prices and UBOS commodity statistics.
 * Used on MarketPrices page and PolicyDashboard.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Coffee, Wheat, Bean } from 'lucide-react';
import { cn } from '@/lib/utils';
import ugandaMarketService, {
  type UCDAExportPrice,
  type UBOSCropStat,
} from '@/lib/api/ugandaMarketService';

function TrendBadge({ pct }: { pct: number }) {
  if (pct > 0)
    return (
      <Badge className="bg-green-500/10 text-green-700 border-green-500/20 gap-1">
        <TrendingUp className="h-3 w-3" />+{pct.toFixed(1)}%
      </Badge>
    );
  if (pct < 0)
    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
        <TrendingDown className="h-3 w-3" />
        {pct.toFixed(1)}%
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="h-3 w-3" />
      Stable
    </Badge>
  );
}

function cropIcon(crop: string) {
  if (crop === 'Coffee') return <Coffee className="h-4 w-4" />;
  if (crop === 'Maize') return <Wheat className="h-4 w-4" />;
  return <Bean className="h-4 w-4" />;
}

export function UgandaPricePanel({ className }: { className?: string }) {
  const [ucda, setUcda] = useState<{
    bulletin_date: string;
    export_prices: UCDAExportPrice[];
    exchange_rate: { usd_ugx: number };
  } | null>(null);
  const [ubos, setUbos] = useState<{
    reference_year: number;
    national_average_prices: UBOSCropStat[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const [ucdaData, ubosData] = await Promise.all([
          ugandaMarketService.ucda(),
          ugandaMarketService.ubos(),
        ]);
        if (cancelled) return;
        setUcda(ucdaData);
        setUbos(ubosData);
      } catch {
        if (!cancelled) setError('Could not load price data. Check backend connection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2', className)}>
        {[0, 1].map((i) => (
          <Card key={i} className="bg-card/60 backdrop-blur-md border-border/40">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map((j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive', className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {/* UCDA Coffee Export Prices */}
      <Card className="bg-card/60 backdrop-blur-md border-border/40 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            UCDA Coffee Export Prices
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {ucda?.bulletin_date ?? 'Today'}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Rate: 1 USD = {ucda?.exchange_rate.usd_ugx.toLocaleString()} UGX
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {(ucda?.export_prices ?? []).map((ep) => (
            <div
              key={ep.grade}
              className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-foreground text-xs">{ep.grade}</p>
                <p className="text-xs text-muted-foreground">{ep.market}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  UGX {ep.price_ugx_per_kg.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/kg</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  USD {ep.price_usd_per_tonne.toLocaleString()}/t
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* UBOS National Commodity Prices */}
      <Card className="bg-card/60 backdrop-blur-md border-border/40 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wheat className="h-4 w-4 text-amber-600" />
            UBOS National Average Prices
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              {ubos?.reference_year}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Uganda Bureau of Statistics — Annual Agricultural Survey
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {(ubos?.national_average_prices ?? []).map((stat) => (
            <div
              key={stat.crop}
              className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-primary">{cropIcon(stat.crop)}</span>
                <div>
                  <p className="font-medium text-foreground text-xs">{stat.crop}</p>
                  <p className="text-xs text-muted-foreground">{stat.data_source}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="font-semibold text-foreground text-xs">
                  UGX {stat.market_ugx_per_kg.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/kg</span>
                </p>
                <TrendBadge pct={stat.yoy_change_pct} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default UgandaPricePanel;
