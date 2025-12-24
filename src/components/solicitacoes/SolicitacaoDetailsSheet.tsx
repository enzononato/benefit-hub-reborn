import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/status-badge';
import { benefitTypeLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, Calendar, User, Building2, FileText, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BenefitRequest {
  id: string;
  protocol: string;
  user_id: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  details: string | null;
  requested_value: number | null;
  created_at: string;
  profile?: {
    full_name: string;
    unit?: {
      name: string;
    } | null;
  } | null;
}

interface SolicitacaoDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BenefitRequest | null;
}

const benefitIcons: Record<BenefitType, React.ComponentType<{ className?: string }>> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  outros: HelpCircle,
};

export function SolicitacaoDetailsSheet({ open, onOpenChange, request }: SolicitacaoDetailsSheetProps) {
  if (!request) return null;

  const Icon = benefitIcons[request.benefit_type] || HelpCircle;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Detalhes da Solicitação
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Protocolo e Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Protocolo</p>
              <p className="font-mono font-medium">{request.protocol}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <Separator />

          {/* Informações do Colaborador */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Colaborador
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm">{request.profile?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenda</p>
                <p className="text-sm">{request.profile?.unit?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalhes do Benefício */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Benefício
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <div className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {benefitTypeLabels[request.benefit_type]}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Solicitado</p>
                <p className="text-sm">
                  {request.requested_value
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(request.requested_value)
                    : 'N/A'}
                </p>
              </div>
            </div>
            {request.details && (
              <div className="pl-6">
                <p className="text-xs text-muted-foreground">Detalhes</p>
                <p className="text-sm mt-1">{request.details}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Datas
            </div>
            <div className="pl-6">
              <p className="text-xs text-muted-foreground">Data da Solicitação</p>
              <p className="text-sm">
                {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
