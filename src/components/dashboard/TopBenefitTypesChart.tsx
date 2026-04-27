import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { cn } from '@/lib/utils';

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface TopBenefitTypesChartProps {
  data: BenefitTypeData[];
  limit?: number;
}

const SERIES_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const TopBenefitTypesChart: React.FC<TopBenefitTypesChartProps> = ({ data, limit = 7 }) => {
  const navigate = useNavigate();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const top = useMemo(() => {
    return [...data].filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, limit);
  }, [data, limit]);

  const total = top.reduce((s, x) => s + x.count, 0);
  const max = Math.max(...top.map((x) => x.count), 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            Top tipos de solicitação
          </CardTitle>
          {total > 0 && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider tabular-nums">
              {total} no período
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem solicitações no período</p>
          </div>
        ) : (
          <div className="space-y-2">
            {top.map((item, idx) => {
              const pct = (item.count / max) * 100;
              const sharePct = total > 0 ? (item.count / total) * 100 : 0;
              const color = SERIES_COLORS[idx % SERIES_COLORS.length];
              const isHover = hoverIdx === idx;
              return (
                <button
                  key={item.type}
                  type="button"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => navigate(`/solicitacoes?benefit_type=${item.type}`)}
                  className={cn(
                    'w-full text-left group rounded-md px-2 py-1.5 transition-colors',
                    'hover:bg-muted/50 cursor-pointer'
                  )}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[12px] font-medium text-foreground truncate">
                        {benefitTypeLabels[item.type]}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                      <span className="text-[11px] text-muted-foreground">{sharePct.toFixed(0)}%</span>
                      <span className="text-sm font-semibold text-foreground">{item.count}</span>
                    </div>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-sm bg-muted">
                    <div
                      className="h-full rounded-sm transition-all duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: isHover ? 1 : 0.85,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopBenefitTypesChart;
