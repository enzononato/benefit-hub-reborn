import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowRight, Eye, Clock, Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, CalendarDays, FileText, Stethoscope, Receipt, CalendarClock, AlertTriangle, Sun, ClipboardList, Smile, HeartPulse, Bus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { benefitTypeLabels } from '@/types/benefits';
import type { BenefitStatus, BenefitType } from '@/types/benefits';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { calculateBusinessHours } from '@/lib/slaUtils';
import { useSlaConfigs } from '@/hooks/useSlaConfigs';

interface RecentRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  user_id: string;
  full_name?: string;
}

const benefitTypeConfig: Partial<Record<BenefitType, { icon: React.ElementType; colorClass: string }>> = {
  autoescola: { icon: Car, colorClass: 'bg-[hsl(var(--benefit-autoescola))] text-[hsl(var(--benefit-autoescola-icon))]' },
  farmacia: { icon: Pill, colorClass: 'bg-[hsl(var(--benefit-farmacia))] text-[hsl(var(--benefit-farmacia-icon))]' },
  oficina: { icon: Wrench, colorClass: 'bg-[hsl(var(--benefit-oficina))] text-[hsl(var(--benefit-oficina-icon))]' },
  vale_gas: { icon: Cylinder, colorClass: 'bg-[hsl(var(--benefit-vale-gas))] text-[hsl(var(--benefit-vale-gas-icon))]' },
  papelaria: { icon: BookOpen, colorClass: 'bg-[hsl(var(--benefit-papelaria))] text-[hsl(var(--benefit-papelaria-icon))]' },
  otica: { icon: Glasses, colorClass: 'bg-[hsl(var(--benefit-otica))] text-[hsl(var(--benefit-otica-icon))]' },
  alteracao_ferias: { icon: CalendarDays, colorClass: 'bg-blue-500 text-white' },
  aviso_folga_falta: { icon: FileText, colorClass: 'bg-indigo-500 text-white' },
  atestado: { icon: Stethoscope, colorClass: 'bg-red-500 text-white' },
  contracheque: { icon: Receipt, colorClass: 'bg-green-500 text-white' },
  abono_horas: { icon: Clock, colorClass: 'bg-teal-500 text-white' },
  alteracao_horario: { icon: CalendarClock, colorClass: 'bg-violet-500 text-white' },
  operacao_domingo: { icon: Sun, colorClass: 'bg-yellow-500 text-white' },
  relatorio_ponto: { icon: ClipboardList, colorClass: 'bg-slate-500 text-white' },
  plano_odontologico: { icon: Smile, colorClass: 'bg-pink-500 text-white' },
  plano_saude: { icon: HeartPulse, colorClass: 'bg-rose-500 text-white' },
  vale_transporte: { icon: Bus, colorClass: 'bg-lime-600 text-white' },
  relato_anomalia: { icon: AlertTriangle, colorClass: 'bg-orange-600 text-white' },
  outros: { icon: HelpCircle, colorClass: 'bg-muted text-muted-foreground' },
};

export function RecentRequests() {
  const navigate = useNavigate();
  const { userModules } = useAuth();
  const { configs: slaConfigs } = useSlaConfigs();
  const [requests, setRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to get SLA status using business hours and config from DB
  const getSlaStatus = (benefitType: BenefitType, createdAt: string): { colorClass: string; label: string } | null => {
    const config = slaConfigs.find(c => c.benefit_type === benefitType);
    
    if (!config) {
      // Fallback: usar valores padrão se não houver config
      const businessHours = calculateBusinessHours(new Date(createdAt), new Date());
      if (businessHours < 2) return { colorClass: 'bg-success', label: 'No prazo' };
      if (businessHours < 6) return { colorClass: 'bg-warning', label: 'Atenção' };
      return { colorClass: 'bg-destructive', label: 'Atrasado' };
    }

    const businessHours = calculateBusinessHours(new Date(createdAt), new Date());
    
    if (businessHours <= config.green_hours) {
      return { colorClass: 'bg-success', label: 'No prazo' };
    } else if (businessHours <= config.yellow_hours) {
      return { colorClass: 'bg-warning', label: 'Atenção' };
    }
    return { colorClass: 'bg-destructive', label: 'Atrasado' };
  };

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        // If user has no modules configured (empty array), show empty
        if (userModules !== null && userModules.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        let query = supabase
          .from('benefit_requests')
          .select('id, protocol, benefit_type, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        // Filter by user's allowed modules (if not admin)
        if (userModules !== null) {
          query = query.in('benefit_type', userModules);
        }

        const { data: requestsData, error } = await query;

        if (error || !requestsData?.length) {
          setRequests([]);
          setLoading(false);
          return;
        }

        const userIds = [...new Set(requestsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);
        setRequests(requestsData.map(req => ({ ...req, full_name: profilesMap.get(req.user_id) || 'Usuário' })));
      } catch {
        // ignore
      }
      setLoading(false);
    };

    setLoading(true);
    fetchRecentRequests();
  }, [userModules]);

  const handleViewProtocol = (protocolId: string) => navigate(`/solicitacoes?protocol=${protocolId}`);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up overflow-hidden" style={{ animationDelay: '200ms' }}>
        <div className="p-4 sm:p-6 border-b border-border"><Skeleton className="h-5 sm:h-6 w-40 sm:w-48" /></div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("flex items-center gap-4 p-4", i % 2 === 1 && "bg-muted/30")}>
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Protocolos Recentes</h3>
        </div>
        <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3"><Clock className="h-8 w-8 opacity-50" /></div>
          <p className="text-sm font-medium">Nenhum protocolo recente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card animate-slide-up overflow-hidden" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Protocolos Recentes</h3>
        <Link to="/solicitacoes" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0">
          Ver todos <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {requests.map((request, index) => {
          const config = benefitTypeConfig[request.benefit_type] || { icon: HelpCircle, colorClass: 'bg-muted text-muted-foreground' };
          const Icon = config.icon;
          const sla = getSlaStatus(request.benefit_type, request.created_at);
          const isOpenStatus = request.status === 'aberta' || request.status === 'em_analise';

          return (
            <div key={request.id} className={cn("flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all duration-200 hover:bg-accent/50 group", index % 2 === 1 && "bg-muted/30")}>
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105", config.colorClass)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground truncate">{request.full_name}</p>
                  <span className="text-xs font-bold text-foreground font-mono hidden sm:inline">{request.protocol}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", config.colorClass)}>{benefitTypeLabels[request.benefit_type]}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
              {isOpenStatus && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={cn("h-2 w-2 rounded-full", sla.colorClass)} />
                  <span className="text-xs text-muted-foreground hidden md:inline">{sla.label}</span>
                </div>
              )}
              <StatusBadge status={request.status} className="shrink-0 hidden sm:flex" />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary" onClick={() => handleViewProtocol(request.id)} title="Ver detalhes">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
