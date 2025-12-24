import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<BenefitType, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  outros: HelpCircle,
};

const colorMap: Record<BenefitType, string> = {
  autoescola: 'bg-chart-1/20 text-chart-1',
  farmacia: 'bg-chart-2/20 text-chart-2',
  oficina: 'bg-chart-3/20 text-chart-3',
  vale_gas: 'bg-chart-4/20 text-chart-4',
  papelaria: 'bg-chart-5/20 text-chart-5',
  otica: 'bg-primary/20 text-primary',
  outros: 'bg-muted text-muted-foreground',
};

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface BenefitCategoryCardsProps {
  data: BenefitTypeData[];
}

const BenefitCategoryCards: React.FC<BenefitCategoryCardsProps> = ({ data }) => {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      {data.map((item) => {
        const Icon = iconMap[item.type] || HelpCircle;
        return (
          <Card key={item.type} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", colorMap[item.type])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {benefitTypeLabels[item.type]}
                  </p>
                  <p className="text-lg font-bold">{item.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BenefitCategoryCards;
