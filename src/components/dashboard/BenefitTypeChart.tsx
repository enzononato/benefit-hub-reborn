import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface BenefitTypeChartProps {
  data: BenefitTypeData[];
}

const COLORS: Record<BenefitType, string> = {
  autoescola: 'hsl(var(--chart-1))',
  farmacia: 'hsl(var(--chart-2))',
  oficina: 'hsl(var(--chart-3))',
  vale_gas: 'hsl(var(--chart-4))',
  papelaria: 'hsl(var(--chart-5))',
  otica: 'hsl(var(--primary))',
  outros: 'hsl(var(--muted-foreground))',
};

const BenefitTypeChart: React.FC<BenefitTypeChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: benefitTypeLabels[item.type],
    value: item.count,
    color: COLORS[item.type],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitTypeChart;
