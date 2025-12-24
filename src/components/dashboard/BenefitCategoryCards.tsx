import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const colorConfig: Record<BenefitType, { bg: string; iconBg: string; iconColor: string }> = {
  autoescola: { bg: 'bg-sky-100 hover:bg-sky-200', iconBg: 'bg-sky-400', iconColor: 'text-white' },
  farmacia: { bg: 'bg-emerald-100 hover:bg-emerald-200', iconBg: 'bg-emerald-400', iconColor: 'text-white' },
  oficina: { bg: 'bg-orange-100 hover:bg-orange-200', iconBg: 'bg-orange-400', iconColor: 'text-white' },
  vale_gas: { bg: 'bg-amber-100 hover:bg-amber-200', iconBg: 'bg-amber-500', iconColor: 'text-white' },
  papelaria: { bg: 'bg-purple-100 hover:bg-purple-200', iconBg: 'bg-purple-300', iconColor: 'text-white' },
  otica: { bg: 'bg-cyan-100 hover:bg-cyan-200', iconBg: 'bg-cyan-400', iconColor: 'text-white' },
  outros: { bg: 'bg-muted hover:bg-muted/80', iconBg: 'bg-muted-foreground/50', iconColor: 'text-white' },
};

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface BenefitCategoryCardsProps {
  data: BenefitTypeData[];
}

const BenefitCategoryCards: React.FC<BenefitCategoryCardsProps> = ({ data }) => {
  const navigate = useNavigate();
  
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const handleCategoryClick = (type: BenefitType) => {
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Solicitações por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {data.map((item) => {
            const Icon = iconMap[item.type] || HelpCircle;
            const config = colorConfig[item.type] || colorConfig.outros;
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;

            return (
              <button
                key={item.type}
                onClick={() => handleCategoryClick(item.type)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  config.bg
                )}
              >
                <div className={cn("rounded-xl p-3", config.iconBg)}>
                  <Icon className={cn("h-6 w-6", config.iconColor)} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {benefitTypeLabels[item.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.count} {item.count === 1 ? 'solicitação' : 'solicitações'}
                  </p>
                  <p className={cn(
                    "text-xs font-bold mt-1",
                    item.count > 0 ? "text-primary" : "text-muted-foreground"
                  )}>
                    {percentage}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitCategoryCards;
