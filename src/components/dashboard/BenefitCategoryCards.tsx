import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { 
  Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Handshake,
  CalendarDays, FileText, Stethoscope, Receipt, Clock,
  AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Convênios (6 itens) - COM título
const convenioTypes: BenefitType[] = [
  'autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'
];

// Cards Soltos (8 itens) - SEM título
const soltoTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'operacao_domingo', 'relatorio_ponto', 'relato_anomalia'
];

// Benefícios (3 itens) - COM título
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

  const conveniosData = data.filter(item => convenioTypes.includes(item.type));
  const soltoData = data.filter(item => soltoTypes.includes(item.type));
  const beneficiosData = data.filter(item => beneficiosTypes.includes(item.type));
  
  const totalConvenios = conveniosData.reduce((sum, item) => sum + item.count, 0);
  const totalBeneficios = beneficiosData.reduce((sum, item) => sum + item.count, 0);
  const totalAll = data.reduce((sum, item) => sum + item.count, 0);

  const handleCategoryClick = (type: BenefitType) => {
    navigate(`/solicitacoes?benefit_type=${type}`);
  };

  const renderCard = (type: BenefitType, total: number) => {
    const Icon = iconMap[type] || HelpCircle;
    const config = colorConfig[type] || colorConfig.outros;
    const itemData = data.find(d => d.type === type);
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
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg">Solicitações por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Convênios (COM título) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-primary shadow-sm">
                <Handshake className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Convênios</h4>
                <p className="text-xs text-muted-foreground">{totalConvenios} solicitações</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {convenioTypes.map((type) => renderCard(type, totalAll))}
            </div>
          </div>

          {/* Coluna 2: Cards Soltos (SEM título) */}
          <div className="flex items-start">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 w-full">
              {soltoTypes.map((type) => renderCard(type, totalAll))}
            </div>
          </div>

          {/* Coluna 3: Benefícios (COM título) */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-3 bg-emerald-600 shadow-sm">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Benefícios</h4>
                <p className="text-xs text-muted-foreground">{totalBeneficios} solicitações</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {beneficiosTypes.map((type) => renderCard(type, totalAll))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BenefitCategoryCards;
