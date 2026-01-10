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

const COLORS: Partial<Record<BenefitType, string>> = {
  autoescola: 'hsl(var(--chart-1))',
  farmacia: 'hsl(var(--chart-2))',
  oficina: 'hsl(var(--chart-3))',
  vale_gas: 'hsl(var(--chart-4))',
  papelaria: 'hsl(var(--chart-5))',
  otica: 'hsl(var(--primary))',
  outros: 'hsl(var(--muted-foreground))',
  alteracao_ferias: 'hsl(210, 70%, 50%)',
  aviso_folga_falta: 'hsl(230, 70%, 50%)',
  atestado: 'hsl(0, 70%, 50%)',
  contracheque: 'hsl(140, 70%, 40%)',
  abono_horas: 'hsl(170, 70%, 40%)',
  alteracao_horario: 'hsl(270, 70%, 50%)',
  operacao_domingo: 'hsl(45, 90%, 50%)',
  relatorio_ponto: 'hsl(210, 20%, 50%)',
  plano_odontologico: 'hsl(330, 70%, 50%)',
  plano_saude: 'hsl(350, 70%, 50%)',
  vale_transporte: 'hsl(90, 60%, 40%)',
  relato_anomalia: 'hsl(25, 90%, 50%)',
};

const BenefitTypeChart: React.FC<BenefitTypeChartProps> = ({ data }) => {
  // Filter out items with 0 count to avoid empty slices
  const chartData = data
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: benefitTypeLabels[item.type],
      value: item.count,
      color: COLORS[item.type],
    }));

  // Custom legend that shows all items with count > 0
  const renderLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-4 px-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Distribuição por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--card))"
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
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {renderLegend()}
      </CardContent>
    </Card>
  );
};

export default BenefitTypeChart;
