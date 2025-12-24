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
import { Search, Eye, Car, Pill, Wrench, Cylinder, BookOpen, Glasses, HelpCircle, CalendarIcon, X, Filter, RefreshCw, Download } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { SolicitacaoDetailsSheet } from '@/components/solicitacoes/SolicitacaoDetailsSheet';
import { toast } from 'sonner';

interface BenefitRequest {
  id: string;
  protocol: string;
  user_id: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  details: string | null;
  requested_value: number | null;
  created_at: string;
  pdf_url?: string | null;
  pdf_file_name?: string | null;
  rejection_reason?: string | null;
  closing_message?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  reviewer_name?: string | null;
  account_id?: number | null;
  conversation_id?: number | null;
  profile?: {
    full_name: string;
    cpf?: string | null;
    phone?: string | null;
    unit_id?: string | null;
    unit?: {
      name: string;
    } | null;
  } | null;
}

interface Unit {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

const benefitIcons: Record<BenefitType, React.ComponentType<{ className?: string }>> = {
  autoescola: Car,
  farmacia: Pill,
  oficina: Wrench,
  vale_gas: Cylinder,
  papelaria: BookOpen,
  otica: Glasses,
  outros: HelpCircle,
};

export default function Solicitacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [typeFilter, setTypeFilter] = useState<string>(searchParams.get('benefit_type') || 'all');
  const [unitFilter, setUnitFilter] = useState<string>(searchParams.get('unit') || 'all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<BenefitRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingViewRequest, setPendingViewRequest] = useState<{ id: string; index: number } | null>(null);

  useEffect(() => {
    fetchRequests();
    fetchUnits();
  }, []);

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

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('benefit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        return;
      }

      // Fetch profiles separately
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, cpf, phone, unit_id, unit:units(name)')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const requestsWithProfiles = (requestsData || []).map(req => ({
        ...req,
        profile: profilesMap.get(req.user_id) || null
      }));

      setRequests(requestsWithProfiles as BenefitRequest[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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
      // Update local state
      setRequests((prev) => prev.map((r) => 
        r.id === pendingViewRequest.id ? { ...r, status: 'em_analise' as BenefitStatus } : r
      ));
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

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Solicitações
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Gerencie todas as solicitações de benefícios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={loading || filteredRequests.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo, nome ou detalhes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
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

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Revenda</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request, idx) => {
                  const Icon = benefitIcons[request.benefit_type] || HelpCircle;
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                  return (
                    <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium font-mono text-sm">{request.protocol}</TableCell>
                      <TableCell>{request.profile?.full_name || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {request.profile?.unit?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="hidden sm:inline">{benefitTypeLabels[request.benefit_type]}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleViewDetails(request.id, globalIndex)}
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

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={() => {}}
          />
        )}
      </div>

      <SolicitacaoDetailsSheet 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        request={selectedRequest}
        onSuccess={fetchRequests}
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
