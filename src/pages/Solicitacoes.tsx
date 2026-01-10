import { useState, useEffect } from 'react';
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
import { useBenefitRequests, BenefitRequest } from '@/hooks/useBenefitRequests';
import { useAuth } from '@/contexts/AuthContext';

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
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('benefit_type') || 'all');
  const [unitFilter, setUnitFilter] = useState<string>(searchParams.get('unit') || 'all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [selectedRequest, setSelectedRequest] = useState<BenefitRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingViewRequest, setPendingViewRequest] = useState<{ id: string; index: number } | null>(null);
  
  const { userModules } = useAuth();
  const { configs: slaConfigs } = useSlaConfigs();
  const { holidays } = useHolidays();
  const { requests, loading, refetch, updateLocalRequest } = useBenefitRequests(userModules);

  // Cache holiday dates set for performance
  const holidayDatesSet = getHolidayDatesSet(holidays);

  // Helper to calculate SLA status using business hours
  const getSlaStatus = (request: BenefitRequest) => {
    const config = slaConfigs.find(c => c.benefit_type === request.benefit_type);
    
    // For completed requests, show nothing in SLA column
    if (request.status === 'aprovada' || request.status === 'recusada') {
      return null;
    }

    if (!config) {
      return { status: 'no-config', label: '—', dotColor: 'bg-muted' };
    }

    // Usar horas úteis (exclui sábados após 12h, domingos e feriados)
    const businessHoursElapsed = calculateBusinessHours(
      new Date(request.created_at),
      new Date(),
      holidayDatesSet
    );
    
    // Converter limites para horas se a unidade for dias
    const timeUnit = (config as any).time_unit || 'hours';
    const greenLimit = timeUnit === 'days' ? config.green_hours * 24 : config.green_hours;
    const yellowLimit = timeUnit === 'days' ? config.yellow_hours * 24 : config.yellow_hours;
    
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
    const headers = ['Protocolo', 'Colaborador', 'CPF', 'Telefone', 'Revenda', 'Tipo', 'Status', 'Valor Solicitado', 'Data', 'Detalhes'];
    
    const rows = filteredRequests.map(request => [
      request.protocol,
      request.profile?.full_name || '',
      request.profile?.cpf || '',
      request.profile?.phone || '',
      request.profile?.unit?.name || '',
      benefitTypeLabels[request.benefit_type] || request.benefit_type,
      statusLabels[request.status] || request.status,
      request.requested_value?.toFixed(2) || '',
      format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      request.details || ''
    ]);

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
      request.protocol.toLowerCase().includes(search.toLowerCase()) ||
      request.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      request.details?.toLowerCase().includes(search.toLowerCase());

    // Handle comma-separated status values from URL
    let matchesStatus = statusFilter === 'all';
    if (!matchesStatus) {
      const statuses = statusFilter.split(',');
      matchesStatus = statuses.includes(request.status);
    }

    const matchesType = typeFilter === 'all' || request.benefit_type === typeFilter;

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
      <div className="space-y-6">
        {/* Header with gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  Solicitações
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  Gerencie todas as solicitações de benefícios
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={exportToCSV} 
                disabled={loading || filteredRequests.length === 0}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => refetch()} 
                disabled={loading}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div 
            className={cn(
              "group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer",
              "bg-gradient-to-br from-info/10 to-info/5 border border-info/20"
            )}
            onClick={() => { setStatusFilter('aberta'); setSearchParams({ status: 'aberta' }); }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Abertas</p>
                <p className="text-2xl font-bold text-info">{statsData.aberta}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-info to-info/50" />
          </div>

          <div 
            className={cn(
              "group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer",
              "bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20"
            )}
            onClick={() => { setStatusFilter('em_analise'); setSearchParams({ status: 'em_analise' }); }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Em Análise</p>
                <p className="text-2xl font-bold text-warning">{statsData.em_analise}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                <Search className="h-5 w-5 text-warning" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-warning to-warning/50" />
          </div>

          <div 
            className={cn(
              "group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer",
              "bg-gradient-to-br from-success/10 to-success/5 border border-success/20"
            )}
            onClick={() => { setStatusFilter('aprovada'); setSearchParams({ status: 'aprovada' }); }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold text-success">{statsData.aprovada}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-success to-success/50" />
          </div>

          <div 
            className={cn(
              "group relative overflow-hidden rounded-xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer",
              "bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20"
            )}
            onClick={() => { setStatusFilter('recusada'); setSearchParams({ status: 'recusada' }); }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Recusadas</p>
                <p className="text-2xl font-bold text-destructive">{statsData.recusada}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-destructive to-destructive/50" />
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por protocolo, nome ou detalhes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background"
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
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
                  className={cn(
                    "w-full sm:w-[200px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {filteredRequests.length} resultados
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <TableHead className="font-semibold">Colaborador</TableHead>
                <TableHead className="font-semibold">Revenda</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">SLA</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                      <p>Nenhuma solicitação encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request, idx) => {
                  const Icon = benefitIcons[request.benefit_type] || HelpCircle;
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                  
                  // Get benefit color based on type
                  const getBenefitColor = (type: BenefitType) => {
                    const colors: Record<string, string> = {
                      autoescola: 'bg-benefit-autoescola text-benefit-autoescola-icon',
                      farmacia: 'bg-benefit-farmacia text-benefit-farmacia-icon',
                      oficina: 'bg-benefit-oficina text-benefit-oficina-icon',
                      vale_gas: 'bg-benefit-vale-gas text-benefit-vale-gas-icon',
                      papelaria: 'bg-benefit-papelaria text-benefit-papelaria-icon',
                      otica: 'bg-benefit-otica text-benefit-otica-icon',
                    };
                    return colors[type] || 'bg-muted text-muted-foreground';
                  };

                  return (
                    <TableRow 
                      key={request.id} 
                      className="group hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                      onClick={() => handleViewDetails(request.id, globalIndex)}
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-medium text-primary">
                          {request.protocol}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{request.profile?.full_name || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                          {request.profile?.unit?.name || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-2 rounded-full px-2.5 py-1",
                          getBenefitColor(request.benefit_type)
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium hidden sm:inline">{benefitTypeLabels[request.benefit_type]}</span>
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
                            <div className="flex items-center gap-2">
                              {sla.dotColor && (
                                <span className={cn("h-2.5 w-2.5 rounded-full", sla.dotColor)} />
                              )}
                              <span className="text-sm text-muted-foreground">{sla.label}</span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(request.id, globalIndex);
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
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
