import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { fetchSyncStatus } from '@/lib/geospatial/mapSearchClient';
import type { SyncStatus } from '@/lib/geospatial/mapSearchTypes';
import { cn } from '@/lib/utils';

export function SyncStatusBadge({ className }: { className?: string }) {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      void fetchSyncStatus()
        .then((s) => {
          if (!cancelled) setStatus(s);
        })
        .catch(() => {
          if (!cancelled) setStatus({ online: false, pending: 0, mode: 'offline', offlineStore: 'sqlite', onlineStore: null });
        });
    };
    poll();
    const id = setInterval(poll, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!status) return null;

  const online = status.online;
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 text-[10px] font-normal',
        online ? 'border-primary/40 bg-primary/5 text-primary' : 'border-muted-foreground/30',
        className,
      )}
    >
      {online ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
      {online ? 'Online sync' : 'Offline (SQLite)'}
      {status.pending > 0 && (
        <>
          <RefreshCw className="h-3 w-3" />
          {status.pending} pending
        </>
      )}
    </Badge>
  );
}
