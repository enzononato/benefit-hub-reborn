import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MonthlyData {
  month: string;
  solicitacoes: number;
  aprovadas: number;
  recusadas: number;
}

interface BenefitsChartProps {
  data: MonthlyData[];
}

const BenefitsChart: React.FC<BenefitsChartProps> = ({ data }) => {
  const totalSolicitacoes = data.reduce((sum, d) => sum + d.solicitacoes, 0);
  const totalAprovadas = data.reduce((sum, d) => sum + d.aprovadas, 0);
  const taxaAprovacao = totalSolicitacoes > 0 ? ((totalAprovadas / totalSolicitacoes) * 100).toFixed(0) : 0;

  const hasData = data.some(d => d.solicitacoes > 0 || d.aprovadas > 0 || d.recusadas > 0);

  if (!hasData) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Solicitações por Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Nenhum dado disponível</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Ajuste os filtros ou aguarde novas solicitações</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Solicitações por Mês
          </CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span>{taxaAprovacao}% aprovação</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value) => <span className="text-xs font-medium">{value}</span>}
              />
              <Bar 
                dataKey="solicitacoes" 
                name="Total" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
              <Bar 
                dataKey="aprovadas" 
                name="Aprovadas" 
                fill="hsl(var(--success))" 
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationBegin={200}
              />
              <Bar 
                dataKey="recusadas" 
                name="Recusadas" 
                fill="hsl(var(--destructive))" 
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationBegin={400}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitsChart;
