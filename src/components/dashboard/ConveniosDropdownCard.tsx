import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { Car, Pill, Wrench, Cylinder, BookOpen, Glasses } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const iconMap: Record<string, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
};

const colorConfig: Record<string, { iconBg: string; iconColor: string }> = {
  autoescola: { iconBg: 'bg-sky-500', iconColor: 'text-white' },
  farmacia: { iconBg: 'bg-emerald-500', iconColor: 'text-white' },
  oficina: { iconBg: 'bg-orange-500', iconColor: 'text-white' },
  vale_gas: { iconBg: 'bg-amber-500', iconColor: 'text-white' },
  papelaria: { iconBg: 'bg-purple-500', iconColor: 'text-white' },
  otica: { iconBg: 'bg-cyan-500', iconColor: 'text-white' },
};

const convenioTypes: BenefitType[] = [
  'autoescola',
  'farmacia',
  'oficina',
  'vale_gas',
  'papelaria',
  'otica',
];

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface ConveniosDropdownCardProps {
  data: BenefitTypeData[];
}

const ConveniosDropdownCard: React.FC<ConveniosDropdownCardProps> = ({ data }) => {
  const navigate = useNavigate();

  const conveniosData = data.filter(item => convenioTypes.includes(item.type));
  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);

  const handleConvenioClick = (type: BenefitType) => {
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Convênios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {convenioTypes.map((type) => {
            const Icon = iconMap[type];
            const config = colorConfig[type];
            const itemData = conveniosData.find(d => d.type === type);
            const count = itemData?.count || 0;
            const percentage = totalConvenios > 0 ? Math.round((count / totalConvenios) * 100) : 0;

            return (
              <div
                key={type}
                onClick={() => handleConvenioClick(type)}
                className="group cursor-pointer"
              >
                <Card className="h-full border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
                  <CardContent className="flex flex-col items-center justify-center p-5 gap-3">
                    <div className={cn(
                      "rounded-2xl p-4 shadow-sm",
                      config.iconBg
                    )}>
                      <Icon className={cn("h-7 w-7", config.iconColor)} />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {benefitTypeLabels[type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {count} solicitações
                      </p>
                      <p className="text-base font-bold text-primary">
                        {percentage}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConveniosDropdownCard;
