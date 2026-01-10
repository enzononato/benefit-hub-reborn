import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { 
  Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Handshake, ChevronDown,
  CalendarDays, FileText, Stethoscope, Receipt, Clock, CalendarClock,
  AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos de convênios
const convenioTypes: BenefitType[] = [
  'autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'
];

// Tipos de solicitações DP
const dpTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'alteracao_horario', 'operacao_domingo', 'relatorio_ponto',
  'plano_odontologico', 'plano_saude', 'vale_transporte', 'relato_anomalia', 'outros'
];

const iconMap: Record<BenefitType, React.ElementType> = {
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
  alteracao_horario: CalendarClock,
  operacao_domingo: Sun,
  relatorio_ponto: ClipboardList,
  plano_odontologico: Smile,
  plano_saude: HeartPulse,
  vale_transporte: Bus,
  relato_anomalia: AlertTriangle,
  outros: HelpCircle,
};

const colorConfig: Record<BenefitType, { iconBg: string; iconColor: string }> = {
  autoescola: { iconBg: 'bg-sky-500', iconColor: 'text-white' },
  farmacia: { iconBg: 'bg-emerald-500', iconColor: 'text-white' },
  oficina: { iconBg: 'bg-orange-500', iconColor: 'text-white' },
  vale_gas: { iconBg: 'bg-amber-500', iconColor: 'text-white' },
  papelaria: { iconBg: 'bg-purple-500', iconColor: 'text-white' },
  otica: { iconBg: 'bg-cyan-500', iconColor: 'text-white' },
  alteracao_ferias: { iconBg: 'bg-blue-500', iconColor: 'text-white' },
  aviso_folga_falta: { iconBg: 'bg-indigo-500', iconColor: 'text-white' },
  atestado: { iconBg: 'bg-red-500', iconColor: 'text-white' },
  contracheque: { iconBg: 'bg-green-500', iconColor: 'text-white' },
  abono_horas: { iconBg: 'bg-teal-500', iconColor: 'text-white' },
  alteracao_horario: { iconBg: 'bg-violet-500', iconColor: 'text-white' },
  operacao_domingo: { iconBg: 'bg-yellow-500', iconColor: 'text-white' },
  relatorio_ponto: { iconBg: 'bg-slate-500', iconColor: 'text-white' },
  plano_odontologico: { iconBg: 'bg-pink-500', iconColor: 'text-white' },
  plano_saude: { iconBg: 'bg-rose-500', iconColor: 'text-white' },
  vale_transporte: { iconBg: 'bg-lime-600', iconColor: 'text-white' },
  relato_anomalia: { iconBg: 'bg-orange-600', iconColor: 'text-white' },
  outros: { iconBg: 'bg-gray-500', iconColor: 'text-white' },
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
  const [isConveniosOpen, setIsConveniosOpen] = useState(false);
  const [isDpOpen, setIsDpOpen] = useState(false);

  const conveniosData = data.filter(item => convenioTypes.includes(item.type));
  const dpData = data.filter(item => dpTypes.includes(item.type));
  
  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);
  const totalDp = dpData.reduce((sum, item) => sum + item.count, 0);

  const handleCategoryClick = (type: BenefitType) => {
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  const renderCategoryCards = (types: BenefitType[], categoryData: BenefitTypeData[], total: number) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {types.map((type) => {
        const Icon = iconMap[type];
        const config = colorConfig[type];
        const itemData = categoryData.find(d => d.type === type);
        const count = itemData?.count || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div
            key={type}
            onClick={() => handleCategoryClick(type)}
            className="group cursor-pointer"
          >
            <Card className="h-full border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200">
              <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                <div className={cn("rounded-xl p-3 shadow-sm", config.iconBg)}>
                  <Icon className={cn("h-6 w-6", config.iconColor)} />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-medium text-foreground leading-tight">
                    {benefitTypeLabels[type]}
                  </p>
                  <p className="text-xs text-muted-foreground">{count} solic.</p>
                  <p className="text-sm font-bold text-primary">{percentage}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Solicitações por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Convênios - Card Colapsável */}
        <Collapsible open={isConveniosOpen} onOpenChange={setIsConveniosOpen}>
          <Card className="border bg-muted/30">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-3 bg-primary shadow-sm">
                    <Handshake className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-foreground">Convênios</h4>
                    <p className="text-xs text-muted-foreground">{totalConvenios} solicitações</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isConveniosOpen && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                {renderCategoryCards(convenioTypes, conveniosData, totalConvenios)}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Solicitações DP - Card Colapsável */}
        <Collapsible open={isDpOpen} onOpenChange={setIsDpOpen}>
          <Card className="border bg-muted/30">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-3 bg-blue-600 shadow-sm">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-semibold text-foreground">Solicitações DP</h4>
                    <p className="text-xs text-muted-foreground">{totalDp} solicitações</p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform duration-200",
                  isDpOpen && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 pb-4">
                {renderCategoryCards(dpTypes, dpData, totalDp)}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default BenefitCategoryCards;
