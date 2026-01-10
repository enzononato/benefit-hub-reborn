import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { Car, Pill, Wrench, Cylinder, BookOpen, Glasses } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
};

const colorConfig: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  autoescola: { bg: 'bg-sky-50 hover:bg-sky-100', iconBg: 'bg-sky-400', iconColor: 'text-white' },
  farmacia: { bg: 'bg-emerald-50 hover:bg-emerald-100', iconBg: 'bg-emerald-400', iconColor: 'text-white' },
  oficina: { bg: 'bg-orange-50 hover:bg-orange-100', iconBg: 'bg-orange-400', iconColor: 'text-white' },
  vale_gas: { bg: 'bg-amber-50 hover:bg-amber-100', iconBg: 'bg-amber-500', iconColor: 'text-white' },
  papelaria: { bg: 'bg-purple-50 hover:bg-purple-100', iconBg: 'bg-purple-300', iconColor: 'text-white' },
  otica: { bg: 'bg-cyan-50 hover:bg-cyan-100', iconBg: 'bg-cyan-400', iconColor: 'text-white' },
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Convênios</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {convenioTypes.map((type) => {
          const Icon = iconMap[type];
          const config = colorConfig[type];
          const itemData = conveniosData.find(d => d.type === type);
          const count = itemData?.count || 0;
          const percentage = totalConvenios > 0 ? Math.round((count / totalConvenios) * 100) : 0;

          return (
            <button
              key={type}
              onClick={() => handleConvenioClick(type)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                config.bg
              )}
            >
              <div className={cn("rounded-xl p-3", config.iconBg)}>
                <Icon className={cn("h-6 w-6", config.iconColor)} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  {benefitTypeLabels[type]}
                </p>
                <p className="text-xs text-muted-foreground">{count} solicitações</p>
                <p className="text-sm font-bold text-primary">{percentage}%</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConveniosDropdownCard;
