import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieIcon } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts';
import { cn } from '@/lib/utils';

interface StatusDonutChartProps {
  abertos: number;
  emAnalise: number;
  aprovados: number;
  reprovados: number;
}

interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  route: string;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  abertos,
  emAnalise,
  aprovados,
  reprovados,
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const segments: Segment[] = useMemo(
    () => [
      { key: 'aberta', label: 'Em aberto', value: abertos, color: 'hsl(var(--info))', route: '/solicitacoes?status=aberta' },
      { key: 'em_analise', label: 'Em análise', value: emAnalise, color: 'hsl(var(--warning))', route: '/solicitacoes?status=em_analise' },
      { key: 'aprovada', label: 'Aprovadas', value: aprovados, color: 'hsl(var(--success))', route: '/solicitacoes?status=aprovada' },
      { key: 'recusada', label: 'Recusadas', value: reprovados, color: 'hsl(var(--destructive))', route: '/solicitacoes?status=recusada' },
    ],
    [abertos, emAnalise, aprovados, reprovados]
  );

  const total = segments.reduce((s, x) => s + x.value, 0);
  const hasData = total > 0;

  const activeSegment = activeIndex !== undefined ? segments[activeIndex] : null;
  const centerValue = activeSegment ? activeSegment.value : total;
  const centerLabel = activeSegment ? activeSegment.label : 'Total';
  const centerPct = activeSegment && total > 0 ? `${((activeSegment.value / total) * 100).toFixed(0)}%` : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <PieIcon className="h-3.5 w-3.5 text-muted-foreground" />
            Distribuição por status
          </CardTitle>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Clique para filtrar
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[260px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem dados no período</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-4 items-center">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, idx) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    onClick={(_, idx) => {
                      const seg = segments[idx];
                      if (seg && seg.value > 0) navigate(seg.route);
                    }}
                    isAnimationActive
                    animationDuration={500}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    {segments.map((seg) => (
                      <Cell key={seg.key} fill={seg.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '6px 10px',
                    }}
                    formatter={(value: number, name: string) => [`${value} (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {centerLabel}
                </span>
                <span className="text-3xl font-semibold text-foreground tabular-nums leading-none mt-1">
                  {centerValue}
                </span>
                {centerPct && (
                  <span className="text-[11px] text-muted-foreground tabular-nums mt-1">{centerPct}</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {segments.map((seg, idx) => {
                const pct = total > 0 ? (seg.value / total) * 100 : 0;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    onClick={() => seg.value > 0 && navigate(seg.route)}
                    disabled={seg.value === 0}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors',
                      seg.value > 0 && 'hover:bg-muted/60 hover:border-border cursor-pointer',
                      seg.value === 0 && 'opacity-50 cursor-not-allowed',
                      isActive && 'bg-muted/60 border-border'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-[12px] font-medium text-foreground truncate">{seg.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 shrink-0">
                      <span className="text-sm font-semibold text-foreground tabular-nums">{seg.value}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusDonutChart;
