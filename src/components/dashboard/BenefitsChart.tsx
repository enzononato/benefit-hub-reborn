import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BeneficiosPorTipo } from '@/types';
import { getBenefitLabel, getBenefitColor } from '@/lib/benefits';
import { formatCurrency } from '@/lib/formatters';

interface BenefitsChartProps {
  data: BeneficiosPorTipo[];
}

const BenefitsChart: React.FC<BenefitsChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: getBenefitLabel(item.tipo),
    valor: item.valor,
    quantidade: item.quantidade,
    fill: getBenefitColor(item.tipo),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benefícios por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitsChart;
