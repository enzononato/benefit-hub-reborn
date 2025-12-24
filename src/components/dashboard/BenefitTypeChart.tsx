import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BeneficiosPorTipo } from '@/types';
import { getBenefitLabel, getBenefitColor } from '@/lib/benefits';

interface BenefitTypeChartProps {
  data: BeneficiosPorTipo[];
}

const BenefitTypeChart: React.FC<BenefitTypeChartProps> = ({ data }) => {
  const chartData = data.map((item) => ({
    name: getBenefitLabel(item.tipo),
    value: item.quantidade,
    color: getBenefitColor(item.tipo),
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
