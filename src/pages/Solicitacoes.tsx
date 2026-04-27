import { useState, useEffect, useDeferredValue, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { benefitTypeLabels, statusLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Calendar } from '@/components/ui/calendar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Eye, Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, CalendarIcon, X, Filter, RefreshCw, Download, ClipboardList, Clock, CheckCircle2, XCircle, CalendarDays, FileText, Stethoscope, Receipt, CalendarClock, AlertTriangle, Sun, Smile, HeartPulse, Bus } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { calculateBusinessHours } from '@/lib/slaUtils';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { SolicitacaoDetailsSheet } from '@/components/solicitacoes/SolicitacaoDetailsSheet';
import { toast } from 'sonner';
import { useSlaConfigs } from '@/hooks/useSlaConfigs';
import { useHolidays, getHolidayDatesSet } from '@/hooks/useHolidays';
import { useBenefitRequests, BenefitRequest, getNewRequestIds, clearNewRequestId } from '@/hooks/useBenefitRequests';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportApprovedPayrollCSV, exportApprovedPayrollXLSX, countApproved } from '@/lib/payrollExport';

interface Unit {
  id: string;
  name: string;
}

const DEFAULT_ITEMS_PER_PAGE = 10;

const benefitIcons: Partial<Record<BenefitType, React.ComponentType<{ className?: string }>>> = {
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

export default function Solicitacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search); // Debounce search for performance
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<BenefitType[]>(() => {
    const raw = searchParams.get('benefit_type');
    return raw ? (raw.split(',') as BenefitType[]) : [];
  });
  const [unitFilter, setUnitFilter] = useState<string>(searchParams.get('unit') || 'all');
  const [userFilter, setUserFilter] = useState<string | null>(searchParams.get('user'));
  const [userFilterName, setUserFilterName] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [selectedRequest, setSelectedRequest] = useState<BenefitRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingViewRequest, setPendingViewRequest] = useState<{ id: string; index: number } | null>(null);
  
  const { userModules, userRole } = useAuth();
  const { configs: slaConfigs } = useSlaConfigs();
  const { holidays } = useHolidays();
  const { requests, loading, refetch, updateLocalRequest } = useBenefitRequests(userModules, userRole);

  // Cache holiday dates set for performance
  const holidayDatesSet = getHolidayDatesSet(holidays);

  // Check for new request highlights
  useEffect(() => {
    const checkNewRequests = () => {
      const newIds = getNewRequestIds();
      if (newIds.size > 0) {
        setHighlightedIds(new Set(newIds));
        // Clear after animation
        newIds.forEach(id => {
          setTimeout(() => {
            clearNewRequestId(id);
            setHighlightedIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, 3000);
        });
      }
    };

    // Check immediately and set up interval
    checkNewRequests();
    const interval = setInterval(checkNewRequests, 500);
    return () => clearInterval(interval);
  }, [requests]);

  // Helper to calculate SLA status using business hours
  const getSlaStatus = (request: BenefitRequest) => {
    const config = slaConfigs.find(c => c.benefit_type === request.benefit_type);
    
    // For completed requests, show nothing in SLA column
    if (request.status === 'aprovada' || request.status === 'recusada') {
      return null;
    }

    // Use default values if no config exists (24h green / 48h yellow)
    const timeUnit = config ? ((config as any).time_unit || 'hours') : 'hours';
    const greenLimit = config
      ? (timeUnit === 'days' ? config.green_hours * 24 : config.green_hours)
      : 24;
    const yellowLimit = config
      ? (timeUnit === 'days' ? config.yellow_hours * 24 : config.yellow_hours)
      : 48;

    // Usar horas úteis (exclui sábados após 12h, domingos e feriados)
    const businessHoursElapsed = calculateBusinessHours(
      new Date(request.created_at),
      new Date(),
      holidayDatesSet
    );
    
    // Formatar label de acordo com a unidade
    const formatLabel = (hours: number) => {
      if (timeUnit === 'days') {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
      }
      return `${hours}h`;
    };
    
    if (businessHoursElapsed <= greenLimit) {
      return { status: 'green', label: formatLabel(businessHoursElapsed), dotColor: 'bg-success' };
    } else if (businessHoursElapsed <= yellowLimit) {
      return { status: 'yellow', label: formatLabel(businessHoursElapsed), dotColor: 'bg-warning' };
    } else {
      return { status: 'red', label: formatLabel(businessHoursElapsed), dotColor: 'bg-destructive' };
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // Restore open request from URL when data loads
  useEffect(() => {
    const requestId = searchParams.get('request');
    if (requestId && requests.length > 0 && !selectedRequest) {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        const index = requests.indexOf(request);
        openRequestDetails(request, index);
      }
    }
  }, [requests, searchParams]);

  // Sync URL params with filters
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlType = searchParams.get('benefit_type');
    const urlUnit = searchParams.get('unit');
    
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    if (urlType && urlType !== typeFilter) {
      setTypeFilter(urlType);
    }
    if (urlUnit && urlUnit !== unitFilter) {
      setUnitFilter(urlUnit);
    }
  }, [searchParams]);

  const fetchUnits = async () => {
    const { data } = await supabase
      .from('units')
      .select('id, name')
      .order('name');
    setUnits(data || []);
  };


  const handleViewDetails = async (requestId: string, index: number) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    // Se status é 'aberta', mostrar confirmação antes de mudar para 'em_analise'
    if (request.status === 'aberta') {
      setPendingViewRequest({ id: requestId, index });
      setConfirmDialogOpen(true);
      return;
    }

    await openRequestDetails(request, index);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingViewRequest) return;

    const request = requests.find(r => r.id === pendingViewRequest.id);
    if (!request) {
      setConfirmDialogOpen(false);
      setPendingViewRequest(null);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('benefit_requests')
      .update({
        status: 'em_analise',
        reviewed_by: userData?.user?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingViewRequest.id);

    if (updateError) {
      console.error('Error updating status:', updateError);
      toast.error('Erro ao atualizar status');
    } else {
      // Update local state via React Query
      updateLocalRequest(pendingViewRequest.id, { status: 'em_analise' as BenefitStatus });
      toast.info('Status alterado para "Em Análise"');
    }

    const updatedRequest = { ...request, status: 'em_analise' as BenefitStatus };
    await openRequestDetails(updatedRequest, pendingViewRequest.index);
    setConfirmDialogOpen(false);
    setPendingViewRequest(null);
  };

  const openRequestDetails = async (request: BenefitRequest, index: number) => {
    // Fetch reviewer name if exists
    let reviewerName = null;
    if (request.reviewed_by) {
      const { data: reviewerData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', request.reviewed_by)
        .maybeSingle();
      reviewerName = reviewerData?.full_name || null;
    }

    const combinedData = {
      ...request,
      reviewer_name: reviewerName,
    };

    setSelectedRequest(combinedData);
    setCurrentIndex(index);
    setDetailsOpen(true);
    
    // Persist to URL
    const newParams = new URLSearchParams(searchParams);
    newParams.set('request', request.id);
    setSearchParams(newParams, { replace: true });
  };

  const handleNavigate = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < filteredRequests.length) {
      const request = filteredRequests[newIndex];
      await handleViewDetails(request.id, newIndex);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setUnitFilter('all');
    setDateRange(undefined);
    setSearchParams({});
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Protocolo', 'Colaborador', 'CPF', 'Telefone', 'Revenda', 'Tipo', 'Status', 'Proventos ', 'descontos ', 'Parcelas', 'Data', 'Detalhes'];
    
    const rows = filteredRequests.map(request => {
      return [
        request.protocol,
        request.profile?.full_name || '',
        request.profile?.cpf || '',
        request.profile?.phone || '',
        request.profile?.unit?.name || '',
        benefitTypeLabels[request.benefit_type] || request.benefit_type,
        statusLabels[request.status] || request.status,
        request.approved_value?.toFixed(2) || '',
        '',
        request.total_installments?.toString() || '',
        request.closed_at
          ? format(new Date(request.closed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
          : format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        request.details || ''
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solicitacoes_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${filteredRequests.length} solicitações exportadas`);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all' || unitFilter !== 'all' || dateRange;

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.protocol.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      request.profile?.full_name?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      request.details?.toLowerCase().includes(deferredSearch.toLowerCase());

    // Handle comma-separated status values from URL
    let matchesStatus = statusFilter === 'all';
    if (!matchesStatus) {
      const statuses = statusFilter.split(',');
      matchesStatus = statuses.includes(request.status);
    }

    // Handle comma-separated benefit_type values from URL (e.g., from CONVÊNIOS card)
    let matchesType = typeFilter === 'all';
    if (!matchesType) {
      const types = typeFilter.split(',');
      matchesType = types.includes(request.benefit_type);
    }

    // Unit filter
    const matchesUnit = unitFilter === 'all' || request.profile?.unit_id === unitFilter;

    // Date range filter
    let matchesDate = true;
    if (dateRange?.from) {
      const requestDate = new Date(request.created_at);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = isWithinInterval(requestDate, { start: from, end: to });
    }

    return matchesSearch && matchesStatus && matchesType && matchesUnit && matchesDate;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats calculation
  const statsData = {
    total: requests.length,
    aberta: requests.filter(r => r.status === 'aberta').length,
    em_analise: requests.filter(r => r.status === 'em_analise').length,
    aprovada: requests.filter(r => r.status === 'aprovada').length,
    recusada: requests.filter(r => r.status === 'recusada').length,
  };

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Solicitações
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Gerencie todas as solicitações de benefícios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || filteredRequests.length === 0}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Exportação padrão</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportToCSV}>
                  Lista filtrada (CSV)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  Folha de pagamento — aprovados ({countApproved(filteredRequests)})
                </DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={countApproved(filteredRequests) === 0}
                  onClick={() => {
                    exportApprovedPayrollCSV(filteredRequests);
                    toast.success('Exportação para folha (CSV) gerada');
                  }}
                >
                  Exportar para folha (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={countApproved(filteredRequests) === 0}
                  onClick={() => {
                    exportApprovedPayrollXLSX(filteredRequests);
                    toast.success('Exportação para folha (XLSX) gerada');
                  }}
                >
                  Exportar para folha (XLSX)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { key: 'aberta', label: 'Abertas', value: statsData.aberta, icon: Clock, dot: 'bg-info', text: 'text-info' },
            { key: 'em_analise', label: 'Em Análise', value: statsData.em_analise, icon: Search, dot: 'bg-warning', text: 'text-warning' },
            { key: 'aprovada', label: 'Aprovadas', value: statsData.aprovada, icon: CheckCircle2, dot: 'bg-success', text: 'text-success' },
            { key: 'recusada', label: 'Recusadas', value: statsData.recusada, icon: XCircle, dot: 'bg-destructive', text: 'text-destructive' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.key}
                className="rounded-lg border border-border bg-card p-3.5 shadow-elevation-1 cursor-pointer transition-colors hover:border-foreground/20 hover:bg-muted/30"
                onClick={() => { setStatusFilter(s.key); setSearchParams({ status: s.key }); }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', s.dot)} />
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
                    </div>
                    <div className="mt-1.5 text-[28px] font-semibold tabular-nums text-foreground leading-none">
                      <AnimatedNumber value={s.value} duration={400} />
                    </div>
                  </div>
                  <div className="rounded-md p-1.5 shrink-0 bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters — barra compacta */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome ou detalhes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v);
              if (v !== 'all') {
                setSearchParams({ status: v });
              } else {
                setSearchParams({});
              }
            }}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-[13px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="aberta">Aberto</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovada">Aprovado</SelectItem>
                <SelectItem value="recusada">Recusado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => {
              setTypeFilter(v);
              const newParams = new URLSearchParams(searchParams);
              if (v !== 'all') {
                newParams.set('benefit_type', v);
              } else {
                newParams.delete('benefit_type');
              }
              setSearchParams(newParams);
            }}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-[13px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(benefitTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={unitFilter} onValueChange={(v) => {
              setUnitFilter(v);
              const newParams = new URLSearchParams(searchParams);
              if (v !== 'all') {
                newParams.set('unit', v);
              } else {
                newParams.delete('unit');
              }
              setSearchParams(newParams);
            }}>
              <SelectTrigger className="w-full sm:w-36 h-9 text-[13px]">
                <SelectValue placeholder="Revenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as revendas</SelectItem>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full sm:w-[180px] h-9 justify-start text-left font-normal text-[13px]",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Período"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-2 px-0.5">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filteredRequests.length} resultados
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-[11px]">
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card shadow-elevation-1 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/40">
                <TableHead>Protocolo</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Revenda</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-7 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-foreground">Nenhuma solicitação encontrada</p>
                      <p className="text-[12px] text-muted-foreground">Ajuste os filtros ou aguarde novas solicitações.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request, idx) => {
                  const Icon = benefitIcons[request.benefit_type] || HelpCircle;
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                  const isNewRequest = highlightedIds.has(request.id);

                  return (
                    <TableRow
                      key={request.id}
                      className={cn(
                        "group cursor-pointer relative",
                        isNewRequest && "bg-info/5"
                      )}
                      onClick={() => handleViewDetails(request.id, globalIndex)}
                    >
                      {isNewRequest && (
                        <td className="absolute left-0 top-0 bottom-0 w-0.5 bg-info p-0" aria-hidden />
                      )}
                      <TableCell>
                        <span className="font-mono text-[12px] font-medium text-foreground tabular-nums">
                          {request.protocol}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">{request.profile?.full_name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] text-muted-foreground">
                          {request.profile?.unit?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 text-foreground">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[13px]">{benefitTypeLabels[request.benefit_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const sla = getSlaStatus(request);
                          if (!sla) return <span className="text-muted-foreground">—</span>;
                          return (
                            <div className="flex items-center gap-1.5">
                              {sla.dotColor && (
                                <span className={cn("h-1.5 w-1.5 rounded-full", sla.dotColor)} />
                              )}
                              <span className="text-[12px] text-muted-foreground tabular-nums">{sla.label}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground tabular-nums">
                        {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(request.id, globalIndex);
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredRequests.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      <SolicitacaoDetailsSheet 
        open={detailsOpen} 
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) {
            setSelectedRequest(null);
            // Remove request from URL when closing
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('request');
            setSearchParams(newParams, { replace: true });
          }
        }} 
        request={selectedRequest}
        onSuccess={() => refetch()}
        currentIndex={currentIndex}
        totalItems={filteredRequests.length}
        onNavigate={handleNavigate}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          setConfirmDialogOpen(open);
          if (!open) setPendingViewRequest(null);
        }}
        title="Iniciar análise?"
        description="Ao visualizar esta solicitação, o status será alterado para 'Em Análise'. O colaborador será notificado sobre esta mudança. Deseja continuar?"
        confirmLabel="Sim, iniciar análise"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmStatusChange}
      />
    </MainLayout>
  );
}
