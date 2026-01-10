import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { Car, Pill, Wrench, Cylinder, BookOpen, Glasses, ChevronDown, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
};

const colorConfig: Record<string, { iconBg: string; iconColor: string }> = {
  autoescola: { iconBg: 'bg-sky-400', iconColor: 'text-white' },
  farmacia: { iconBg: 'bg-emerald-400', iconColor: 'text-white' },
  oficina: { iconBg: 'bg-orange-400', iconColor: 'text-white' },
  vale_gas: { iconBg: 'bg-amber-500', iconColor: 'text-white' },
  papelaria: { iconBg: 'bg-purple-300', iconColor: 'text-white' },
  otica: { iconBg: 'bg-cyan-400', iconColor: 'text-white' },
};

// Tipos de convênio (apenas os 6 convênios)
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
  const [open, setOpen] = React.useState(false);

  // Filtra apenas os convênios
  const conveniosData = data.filter(item => convenioTypes.includes(item.type));
  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);

  const handleConvenioClick = (type: BenefitType) => {
    setOpen(false);
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Convênios</CardTitle>
                <p className="text-xs text-muted-foreground">{totalConvenios} solicitações</p>
              </div>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )} />
          </CardHeader>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2 bg-popover" align="start">
        <div className="space-y-1">
          {convenioTypes.map((type) => {
            const Icon = iconMap[type];
            const config = colorConfig[type];
            const itemData = conveniosData.find(d => d.type === type);
            const count = itemData?.count || 0;

            return (
              <button
                key={type}
                onClick={() => handleConvenioClick(type)}
                className={cn(
                  "flex items-center gap-3 w-full p-2 rounded-md transition-colors",
                  "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                <div className={cn("rounded-lg p-1.5", config.iconBg)}>
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                </div>
                <span className="text-sm font-medium text-foreground flex-1 text-left">
                  {benefitTypeLabels[type]}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConveniosDropdownCard;
