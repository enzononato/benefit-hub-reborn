import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { 
  Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Handshake,
  CalendarDays, FileText, Stethoscope, Receipt, Clock,
  AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus, Gift, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Convênios (6 itens)
const convenioTypes: BenefitType[] = [
  'autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'
];

// Cards Soltos (8 itens) - exibidos diretamente no grid principal
const soltoTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'operacao_domingo', 'relatorio_ponto', 'relato_anomalia'
];

// Benefícios (3 itens)
const beneficiosTypes: BenefitType[] = [
  'plano_odontologico', 'plano_saude', 'vale_transporte'
];

const iconMap: Record<string, React.ElementType> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  alteracao_ferias: CalendarDays,
  aviso_folga_falta: FileText,
  atestado: Stethoscope,
  contracheque: Receipt,
  abono_horas: Clock,
  operacao_domingo: Sun,
  relatorio_ponto: ClipboardList,
  plano_odontologico: Smile,
  plano_saude: HeartPulse,
  vale_transporte: Bus,
  relato_anomalia: AlertTriangle,
  outros: HelpCircle,
};

const colorConfig: Record<string, { iconBg: string; iconColor: string }> = {
  // Convênios
  autoescola: { iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  farmacia: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  oficina: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  vale_gas: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  papelaria: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  otica: { iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  // Cards Soltos
  alteracao_ferias: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  aviso_folga_falta: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  atestado: { iconBg: 'bg-red-100', iconColor: 'text-red-500' },
  contracheque: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  abono_horas: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  operacao_domingo: { iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  relatorio_ponto: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
  relato_anomalia: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  // Benefícios
  plano_odontologico: { iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  plano_saude: { iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  vale_transporte: { iconBg: 'bg-lime-100', iconColor: 'text-lime-600' },
  outros: { iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
};

interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

interface BenefitCategoryCardsProps {
  data: BenefitTypeData[];
  /** null = acesso total (admin). Array = tipos permitidos */
  allowedTypes?: BenefitType[] | null;
}

const BenefitCategoryCards: React.FC<BenefitCategoryCardsProps> = ({ data, allowedTypes = null }) => {
  const navigate = useNavigate();
  const [isConveniosOpen, setIsConveniosOpen] = useState(false);
  const [isBeneficiosOpen, setIsBeneficiosOpen] = useState(false);

  const allowedSet = allowedTypes ? new Set(allowedTypes) : null;

  const visibleConvenioTypes = allowedSet ? convenioTypes.filter((t) => allowedSet.has(t)) : convenioTypes;
  const visibleBeneficiosTypes = allowedSet ? beneficiosTypes.filter((t) => allowedSet.has(t)) : beneficiosTypes;
  const visibleSoltoTypes = allowedSet ? soltoTypes.filter((t) => allowedSet.has(t)) : soltoTypes;

  const showConvenios = visibleConvenioTypes.length > 0;
  const showBeneficios = visibleBeneficiosTypes.length > 0;

  const conveniosData = data.filter((item) => visibleConvenioTypes.includes(item.type));
  const beneficiosData = data.filter((item) => visibleBeneficiosTypes.includes(item.type));

  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);
  const totalBeneficios = beneficiosData.reduce((sum, item) => sum + item.count, 0);

  const soltoFirst = visibleSoltoTypes.slice(0, 4);
  const soltoLast = visibleSoltoTypes.slice(4);

  const handleCategoryClick = (type: BenefitType) => {
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  const handleConveniosClick = () => {
    if (!showConvenios) return;
    const types = visibleConvenioTypes.join(',');
    navigate(`/solicitacoes?benefit_type=${types}`);
  };

  const handleBeneficiosClick = () => {
    if (!showBeneficios) return;
    const types = visibleBeneficiosTypes.join(',');
    navigate(`/solicitacoes?benefit_type=${types}`);
  };

  const renderCard = (type: BenefitType) => {
    const Icon = iconMap[type] || HelpCircle;
    const config = colorConfig[type] || colorConfig.outros;
    const itemData = data.find(d => d.type === type);
    const count = itemData?.count || 0;

    return (
      <div
        key={type}
        onClick={() => handleCategoryClick(type)}
        className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200"
      >
        <div className={cn("rounded-full p-3", config.iconBg)}>
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>
        <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
          {benefitTypeLabels[type]}
        </span>
        <span className="text-2xl font-bold text-foreground">{count}</span>
      </div>
    );
  };

  const renderGroupCard = (
    label: string, 
    count: number, 
    Icon: React.ElementType, 
    iconBg: string, 
    iconColor: string,
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    onTitleClick: () => void
  ) => {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col items-center gap-2">
        <div 
          className={cn("rounded-full p-3 cursor-pointer hover:opacity-80 transition-opacity", iconBg)}
          onClick={onTitleClick}
        >
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <span 
          className="text-xs font-medium text-muted-foreground text-center leading-tight cursor-pointer hover:text-foreground transition-colors"
          onClick={onTitleClick}
        >
          {label}
        </span>
        <span className="text-2xl font-bold text-foreground">{count}</span>
        <button
          onClick={() => onOpenChange(!isOpen)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
          {isOpen ? 'Fechar' : 'Ver todos'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Grid principal com cards conforme módulos permitidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* Card CONVÊNIOS */}
        {showConvenios &&
          renderGroupCard(
            'CONVÊNIOS',
            totalConvenios,
            Handshake,
            'bg-violet-100',
            'text-violet-600',
            isConveniosOpen,
            setIsConveniosOpen,
            handleConveniosClick
          )}

        {/* Cards Soltos */}
        {soltoFirst.map((type) => renderCard(type))}

        {/* Card BENEFÍCIOS */}
        {showBeneficios &&
          renderGroupCard(
            'BENEFÍCIOS',
            totalBeneficios,
            Gift,
            'bg-pink-100',
            'text-pink-600',
            isBeneficiosOpen,
            setIsBeneficiosOpen,
            handleBeneficiosClick
          )}

        {/* Cards Soltos */}
        {soltoLast.map((type) => renderCard(type))}
      </div>

      {/* Convênios expandidos */}
      {showConvenios && (
        <Collapsible open={isConveniosOpen} onOpenChange={setIsConveniosOpen}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="bg-muted/30 rounded-xl p-4 border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Handshake className="h-4 w-4 text-violet-600" />
                Convênios
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {visibleConvenioTypes.map((type) => renderCard(type))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Benefícios expandidos */}
      {showBeneficios && (
        <Collapsible open={isBeneficiosOpen} onOpenChange={setIsBeneficiosOpen}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="bg-muted/30 rounded-xl p-4 border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Gift className="h-4 w-4 text-pink-600" />
                Benefícios
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {visibleBeneficiosTypes.map((type) => renderCard(type))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default BenefitCategoryCards;
