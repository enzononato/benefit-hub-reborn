import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopCollaboratorEntry {
  userId: string;
  name: string;
  unitName?: string | null;
  count: number;
}

interface TopCollaboratorsCardProps {
  data: TopCollaboratorEntry[];
  loading?: boolean;
  limit?: number;
  onSelect?: (entry: TopCollaboratorEntry) => void;
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('') || '?';

const TopCollaboratorsCard: React.FC<TopCollaboratorsCardProps> = ({
  data,
  loading,
  limit = 8,
  onSelect,
}) => {
  const items = data.slice(0, limit);
  const max = items[0]?.count ?? 0;
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            Top colaboradores
          </CardTitle>
          {total > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums">
              {items.length} de {data.length}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem dados no período</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item, idx) => {
              const pct = max > 0 ? (item.count / max) * 100 : 0;
              const share = total > 0 ? ((item.count / total) * 100).toFixed(0) : '0';
              return (
                <li
                  key={item.userId}
                  className="group relative flex items-center gap-2.5 rounded-md border border-border bg-card px-2 py-1.5 hover:bg-muted/40 transition-colors"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums',
                      idx === 0
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
                    {initialsOf(item.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.name}
                      </p>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                        {item.count}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-foreground/80 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {share}%
                      </span>
                      {item.unitName && (
                        <span className="shrink-0 truncate max-w-[80px] text-[10px] text-muted-foreground">
                          · {item.unitName}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default TopCollaboratorsCard;
