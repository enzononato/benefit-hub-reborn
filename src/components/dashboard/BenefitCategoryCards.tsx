import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BeneficiosPorTipo } from '@/types';
import { getBenefitLabel, getBenefitColor } from '@/lib/benefits';
import { formatCurrency } from '@/lib/formatters';
import { Heart, Utensils, Bus, GraduationCap, Package } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  saude: Heart,
  alimentacao: Utensils,
  transporte: Bus,
  educacao: GraduationCap,
  outros: Package,
};

interface BenefitCategoryCardsProps {
  data: BeneficiosPorTipo[];
}

const BenefitCategoryCards: React.FC<BenefitCategoryCardsProps> = ({ data }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {data.map((item) => {
        const Icon = iconMap[item.tipo] || Package;
        return (
          <Card key={item.tipo} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: getBenefitColor(item.tipo) + '20' }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color: getBenefitColor(item.tipo) }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {getBenefitLabel(item.tipo)}
                  </p>
                  <p className="text-lg font-bold">{item.quantidade}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrency(item.valor)}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BenefitCategoryCards;
