import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { 
  Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Handshake,
  CalendarDays, FileText, Stethoscope, Receipt, Clock,
  AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus, Gift, ChevronDown,
  Users, Cake, UserPlus, FileSpreadsheet, Info, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Convênios (6 itens)
const convenioTypes: BenefitType[] = [
  'autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'
];

// Cards Soltos (10 itens) - exibidos diretamente no grid principal
const soltoTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'alteracao_horario', 'operacao_domingo', 'relatorio_ponto', 
  'relato_anomalia', 'plantao_duvidas', 'solides'
];

// Benefícios (3 itens)
const beneficiosTypes: BenefitType[] = [
  'plano_odontologico', 'plano_saude', 'vale_transporte'
];

// Outros (5 itens) - submenu similar a convênios
const outrosTypes: BenefitType[] = [
  'listagem_funcionarios', 'listagem_aniversariantes', 'listagem_dependentes',
  'listagem_pdcs', 'informacoes_diversas'
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
  alteracao_horario: Clock,
  operacao_domingo: Sun,
  relatorio_ponto: ClipboardList,
  plantao_duvidas: HelpCircle,
  solides: FileText,
  plano_odontologico: Smile,
  plano_saude: HeartPulse,
  vale_transporte: Bus,
  relato_anomalia: AlertTriangle,
  outros: HelpCircle,
  // Categoria Outros
  listagem_funcionarios: Users,
  listagem_aniversariantes: Cake,
  listagem_dependentes: UserPlus,
  listagem_pdcs: FileSpreadsheet,
  informacoes_diversas: Info,
};

const colorConfig: Record<string, { iconBg: string; iconColor: string }> = {
  // Convênios
  autoescola: { iconBg: 'bg-slate-100 dark:bg-slate-800/60', iconColor: 'text-slate-700 dark:text-slate-300' },
  farmacia: { iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-700 dark:text-emerald-400' },
  oficina: { iconBg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-700 dark:text-orange-400' },
  vale_gas: { iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-700 dark:text-amber-400' },
  papelaria: { iconBg: 'bg-stone-100 dark:bg-stone-800/60', iconColor: 'text-stone-700 dark:text-stone-300' },
  otica: { iconBg: 'bg-cyan-50 dark:bg-cyan-950/40', iconColor: 'text-cyan-700 dark:text-cyan-400' },
  // Cards Soltos
  alteracao_ferias: { iconBg: 'bg-amber-50 dark:bg-amber-950/40', iconColor: 'text-amber-700 dark:text-amber-400' },
  aviso_folga_falta: { iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-700 dark:text-blue-400' },
  atestado: { iconBg: 'bg-red-50 dark:bg-red-950/40', iconColor: 'text-red-700 dark:text-red-400' },
  contracheque: { iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-700 dark:text-emerald-400' },
  abono_horas: { iconBg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-700 dark:text-teal-400' },
  alteracao_horario: { iconBg: 'bg-slate-100 dark:bg-slate-800/60', iconColor: 'text-slate-700 dark:text-slate-300' },
  operacao_domingo: { iconBg: 'bg-yellow-50 dark:bg-yellow-950/40', iconColor: 'text-yellow-700 dark:text-yellow-400' },
  relatorio_ponto: { iconBg: 'bg-zinc-100 dark:bg-zinc-800/60', iconColor: 'text-zinc-700 dark:text-zinc-300' },
  relato_anomalia: { iconBg: 'bg-orange-50 dark:bg-orange-950/40', iconColor: 'text-orange-700 dark:text-orange-400' },
  plantao_duvidas: { iconBg: 'bg-blue-50 dark:bg-blue-950/40', iconColor: 'text-blue-700 dark:text-blue-400' },
  solides: { iconBg: 'bg-slate-100 dark:bg-slate-800/60', iconColor: 'text-slate-700 dark:text-slate-300' },
  // Benefícios
  plano_odontologico: { iconBg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: 'text-pink-700 dark:text-pink-400' },
  plano_saude: { iconBg: 'bg-rose-50 dark:bg-rose-950/40', iconColor: 'text-rose-700 dark:text-rose-400' },
  vale_transporte: { iconBg: 'bg-lime-50 dark:bg-lime-950/40', iconColor: 'text-lime-700 dark:text-lime-400' },
  outros: { iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
  // Categoria Outros
  listagem_funcionarios: { iconBg: 'bg-slate-100 dark:bg-slate-800/60', iconColor: 'text-slate-700 dark:text-slate-300' },
  listagem_aniversariantes: { iconBg: 'bg-pink-50 dark:bg-pink-950/40', iconColor: 'text-pink-700 dark:text-pink-400' },
  listagem_dependentes: { iconBg: 'bg-teal-50 dark:bg-teal-950/40', iconColor: 'text-teal-700 dark:text-teal-400' },
  listagem_pdcs: { iconBg: 'bg-stone-100 dark:bg-stone-800/60', iconColor: 'text-stone-700 dark:text-stone-300' },
  informacoes_diversas: { iconBg: 'bg-cyan-50 dark:bg-cyan-950/40', iconColor: 'text-cyan-700 dark:text-cyan-400' },
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
  const [isOutrosOpen, setIsOutrosOpen] = useState(false);

  const allowedSet = allowedTypes ? new Set(allowedTypes) : null;

  const visibleConvenioTypes = allowedSet ? convenioTypes.filter((t) => allowedSet.has(t)) : convenioTypes;
  const visibleBeneficiosTypes = allowedSet ? beneficiosTypes.filter((t) => allowedSet.has(t)) : beneficiosTypes;
  const visibleSoltoTypes = allowedSet ? soltoTypes.filter((t) => allowedSet.has(t)) : soltoTypes;
  const visibleOutrosTypes = allowedSet ? outrosTypes.filter((t) => allowedSet.has(t)) : outrosTypes;

  const showConvenios = visibleConvenioTypes.length > 0;
  const showBeneficios = visibleBeneficiosTypes.length > 0;
  const showOutros = visibleOutrosTypes.length > 0;

  const conveniosData = data.filter((item) => visibleConvenioTypes.includes(item.type));
  const beneficiosData = data.filter((item) => visibleBeneficiosTypes.includes(item.type));
  const outrosData = data.filter((item) => visibleOutrosTypes.includes(item.type));

  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);
  const totalBeneficios = beneficiosData.reduce((sum, item) => sum + item.count, 0);
  const totalOutros = outrosData.reduce((sum, item) => sum + item.count, 0);

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

  const handleOutrosClick = () => {
    if (!showOutros) return;
    const types = visibleOutrosTypes.join(',');
    navigate(`/solicitacoes?benefit_type=${types}`);
  };

  const renderCard = (type: BenefitType) => {
    const Icon = iconMap[type] || HelpCircle;
    const config = colorConfig[type] || colorConfig.outros;
    const itemData = data.find(d => d.type === type);
    const count = itemData?.count || 0;
    const hasRecent = count > 0;

    return (
      <div
        key={type}
        onClick={() => handleCategoryClick(type)}
        className="relative bg-card rounded-lg border border-border shadow-elevation-1 p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:border-foreground/20 hover:bg-muted/30 transition-colors group"
      >
        {hasRecent && (
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-info" />
        )}
        <div className={cn(
          "rounded-md p-2 transition-colors",
          config.iconBg
        )}>
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
          {benefitTypeLabels[type]}
        </span>
        <span className="text-xl font-semibold text-foreground tabular-nums leading-none">{count}</span>
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
      <div className="relative bg-card rounded-lg border border-border shadow-elevation-1 p-3 flex flex-col items-center gap-1.5 group">
        {count > 0 && (
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-info" />
        )}
        <div 
          className={cn(
            "rounded-md p-2 cursor-pointer transition-colors",
            iconBg
          )}
          onClick={onTitleClick}
        >
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
        <span 
          className="text-[11px] font-medium text-muted-foreground text-center leading-tight cursor-pointer hover:text-foreground transition-colors uppercase tracking-wide"
          onClick={onTitleClick}
        >
          {label}
        </span>
        <span className="text-xl font-semibold text-foreground tabular-nums leading-none">{count}</span>
        <button
          onClick={() => onOpenChange(!isOpen)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isOpen && "rotate-180")} />
          {isOpen ? 'Fechar' : 'Ver todos'}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Grid principal com cards conforme módulos permitidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
        {/* Card CONVÊNIOS */}
        {showConvenios &&
          renderGroupCard(
            'CONVÊNIOS',
            totalConvenios,
            Handshake,
            'bg-muted',
            'text-foreground',
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
            'bg-muted',
            'text-foreground',
            isBeneficiosOpen,
            setIsBeneficiosOpen,
            handleBeneficiosClick
          )}

        {/* Cards Soltos */}
        {soltoLast.map((type) => renderCard(type))}

        {/* Card OUTROS */}
        {showOutros &&
          renderGroupCard(
            'OUTROS',
            totalOutros,
            MoreHorizontal,
            'bg-muted',
            'text-foreground',
            isOutrosOpen,
            setIsOutrosOpen,
            handleOutrosClick
          )}
      </div>

      {/* Convênios expandidos */}
      {showConvenios && (
        <Collapsible open={isConveniosOpen} onOpenChange={setIsConveniosOpen}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="bg-muted/40 rounded-lg p-3 border border-border">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5" />
                Convênios
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
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
            <div className="bg-muted/40 rounded-lg p-3 border border-border">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" />
                Benefícios
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {visibleBeneficiosTypes.map((type) => renderCard(type))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Outros expandidos */}
      {showOutros && (
        <Collapsible open={isOutrosOpen} onOpenChange={setIsOutrosOpen}>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="bg-muted/40 rounded-lg p-3 border border-border">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <MoreHorizontal className="h-3.5 w-3.5" />
                Outros
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {visibleOutrosTypes.map((type) => renderCard(type))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default BenefitCategoryCards;