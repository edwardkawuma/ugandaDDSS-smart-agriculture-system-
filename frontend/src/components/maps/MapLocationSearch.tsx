import { useCallback, useEffect, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchMapLocations, suggestMapLocations } from '@/lib/geospatial/mapSearchClient';
import type { MapSearchResult } from '@/lib/geospatial/mapSearchTypes';

const markerIcon = L.divIcon({
  className: 'map-search-marker',
  html: '<div style="background:hsl(25 95% 50%);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapLocationSearchProps {
  className?: string;
  onResultsChange?: (results: MapSearchResult[]) => void;
}

export function MapLocationSearch({ className, onResultsChange }: MapLocationSearchProps) {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'location' | 'district' | 'town' | 'agricultural_zone'>('location');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<MapSearchResult[]>([]);
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [source, setSource] = useState<string>('local');

  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      void suggestMapLocations(query.trim())
        .then((res) => setSuggestions(res.suggestions ?? []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    try {
      const res = await searchMapLocations(q, searchType);
      setResults(res.results);
      setSource(res.source);
      if (res.results.length) {
        const first = res.results[0];
        map.flyTo([first.lat, first.lng], 10, { duration: 1.2 });
      }
    } finally {
      setLoading(false);
      setSuggestions([]);
    }
  }, [query, searchType, map]);

  const selectResult = (item: MapSearchResult) => {
    setResults([item]);
    setQuery(item.title);
    setSuggestions([]);
    map.flyTo([item.lat, item.lng], 11, { duration: 1 });
  };

  const clearResults = () => {
    setResults([]);
    setQuery('');
  };

  return (
    <>
      <div className={cn('absolute left-3 top-3 z-[1000] w-[min(100%,320px)]', className)}>
        <div className="rounded-lg border border-border/50 bg-card/95 p-2 shadow-lg backdrop-blur-md">
          <div className="mb-2 flex flex-wrap gap-1">
            {(
              [
                ['location', 'All'],
                ['district', 'Districts'],
                ['town', 'Towns'],
                ['agricultural_zone', 'Ag Zones'],
              ] as const
            ).map(([type, label]) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={searchType === type ? 'default' : 'outline'}
                className="h-6 px-2 text-[10px]"
                onClick={() => setSearchType(type)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
                placeholder="Search Uganda locations…"
                className="h-8 bg-background pl-7 text-xs"
              />
            </div>
            <Button type="button" size="sm" className="h-8 px-2" onClick={() => void runSearch()} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Go'}
            </Button>
            {results.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={clearResults}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {source && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Source: {source === 'serpapi' ? 'SerpApi Google Maps' : 'Local GeoJSON'}
            </p>
          )}
          {suggestions.length > 0 && (
            <ul className="mt-1 max-h-36 overflow-auto rounded border border-border/40 bg-background text-xs">
              {suggestions.map((s, i) => (
                <li key={`${s.title}-${i}`}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-2 py-1.5 text-left hover:bg-muted/60"
                    onClick={() => selectResult(s)}
                  >
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    <span>
                      <span className="block font-medium">{s.title}</span>
                      <span className="text-[10px] text-muted-foreground">{s.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {results.map((r, i) => (
        <Marker key={`${r.title}-${i}`} position={[r.lat, r.lng]} icon={markerIcon}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-muted-foreground">{r.subtitle}</p>
              <Badge variant="outline" className="text-[10px]">
                {r.type}
              </Badge>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
