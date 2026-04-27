import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface MonthlyData {
  month: string;
  solicitacoes: number;
  aprovadas: number;
  recusadas: number;
}

interface BenefitsChartProps {
  data: MonthlyData[];
}

type SeriesKey = 'solicitacoes' | 'aprovadas' | 'recusadas';

const SERIES: { key: SeriesKey; label: string; color: string; type: 'line' }[] = [
  { key: 'solicitacoes', label: 'Total', color: 'hsl(var(--chart-1))', type: 'line' },
  { key: 'aprovadas', label: 'Aprovadas', color: 'hsl(var(--success))', type: 'line' },
  { key: 'recusadas', label: 'Recusadas', color: 'hsl(var(--destructive))', type: 'line' },
];

const BenefitsChart: React.FC<BenefitsChartProps> = ({ data }) => {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  const totalSolicitacoes = data.reduce((sum, d) => sum + d.solicitacoes, 0);
  const totalAprovadas = data.reduce((sum, d) => sum + d.aprovadas, 0);
  const taxaAprovacao = totalSolicitacoes > 0 ? ((totalAprovadas / totalSolicitacoes) * 100).toFixed(0) : '0';

  const hasData = data.some((d) => d.solicitacoes > 0 || d.aprovadas > 0 || d.recusadas > 0);

  const toggle = (k: SeriesKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      // Não permitir esconder todas
      if (next.size === SERIES.length) return prev;
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            Evolução mensal
          </CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            {hasData && (
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider tabular-nums">
                {taxaAprovacao}% aprovação
              </span>
            )}
            <div className="flex items-center gap-1">
              {SERIES.map((s) => {
                const isHidden = hidden.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggle(s.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium transition-colors',
                      isHidden ? 'opacity-40 hover:opacity-70' : 'hover:bg-muted/60'
                    )}
                  >
                    <span
                      className={cn('h-2 w-2 rounded-sm shrink-0', isHidden && 'opacity-50')}
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Sem dados no período</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '6px 10px',
                  }}
                  cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                />
                {!hidden.has('solicitacoes') && (
                  <Line
                    type="monotone"
                    dataKey="solicitacoes"
                    name="Total"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--chart-1))', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    animationDuration={500}
                  />
                )}
                {!hidden.has('aprovadas') && (
                  <Line
                    type="monotone"
                    dataKey="aprovadas"
                    name="Aprovadas"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--success))', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    animationDuration={500}
                  />
                )}
                {!hidden.has('recusadas') && (
                  <Line
                    type="monotone"
                    dataKey="recusadas"
                    name="Recusadas"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--destructive))', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    animationDuration={500}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BenefitsChart;
