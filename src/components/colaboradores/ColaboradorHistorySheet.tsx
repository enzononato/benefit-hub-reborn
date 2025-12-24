import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BenefitRequest, benefitTypeLabels, BenefitType, BenefitStatus } from '@/types/benefits';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, Clock, History, Filter, Download, CreditCard, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const statusLabels: Record<BenefitStatus, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Análise',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  concluida: 'Concluída',
};

const statusFilterOptions: { value: string; label: string }[] = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'aprovada_concluida', label: 'Aprovada' },
  { value: 'recusada', label: 'Recusada' },
];

interface ColaboradorHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador: {
    user_id: string;
    full_name: string;
  } | null;
}

export function ColaboradorHistorySheet({
  open,
  onOpenChange,
  colaborador,
}: ColaboradorHistorySheetProps) {
  const [requests, setRequests] = useState<(BenefitRequest & { total_installments?: number; paid_installments?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [updatingInstallment, setUpdatingInstallment] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      let matchesStatus = statusFilter === 'all';
      if (statusFilter === 'aprovada_concluida') {
        matchesStatus = req.status === 'aprovada' || req.status === 'concluida';
      } else if (statusFilter !== 'all') {
        matchesStatus = req.status === statusFilter;
      }
      const matchesType = typeFilter === 'all' || req.benefit_type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [requests, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all';

  useEffect(() => {
    if (open && colaborador) {
      fetchRequests();
      clearFilters();
    }
  }, [open, colaborador]);

  const fetchRequests = async () => {
    if (!colaborador) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('benefit_requests')
      .select('*')
      .eq('user_id', colaborador.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const handlePayInstallment = async (requestId: string, currentPaid: number, total: number) => {
    if (currentPaid >= total) return;

    setUpdatingInstallment(requestId);
    const newPaidCount = currentPaid + 1;

    const { error } = await supabase
      .from('benefit_requests')
      .update({ paid_installments: newPaidCount })
      .eq('id', requestId);

    if (error) {
      toast.error('Erro ao registrar parcela');
      console.error(error);
    } else {
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, paid_installments: newPaidCount }
          : req
      ));
      toast.success(`Parcela ${newPaidCount}/${total} registrada!`);
    }
    setUpdatingInstallment(null);
  };

  const exportToCSV = () => {
    if (!colaborador || filteredRequests.length === 0) return;

    const headers = ['Protocolo', 'Tipo', 'Status', 'Valor Aprovado', 'Parcelas', 'Data', 'Motivo Recusa'];
    const rows = filteredRequests.map((req) => [
      req.protocol,
      benefitTypeLabels[req.benefit_type],
      statusLabels[req.status],
      req.approved_value ? `R$ ${req.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
      req.total_installments && req.total_installments > 1
        ? `${req.paid_installments || 0}/${req.total_installments}`
        : 'À vista',
      format(new Date(req.created_at), 'dd/MM/yyyy HH:mm'),
      req.rejection_reason || '',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_${colaborador.full_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso!');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <div className="px-6 pt-6 pb-4">
          <SheetHeader className="space-y-1">
            <SheetTitle className="text-left flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Solicitações
            </SheetTitle>
            {colaborador && (
              <p className="text-sm text-muted-foreground font-normal">
                {colaborador.full_name}
              </p>
            )}
          </SheetHeader>

          {!loading && requests.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {filteredRequests.length} de {requests.length} {requests.length === 1 ? 'solicitação' : 'solicitações'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 shrink-0"
                  onClick={exportToCSV}
                  disabled={filteredRequests.length === 0}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Exportar</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    {statusFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(benefitTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={clearFilters}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <Clock className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">Nenhuma solicitação</p>
                <p className="text-sm mt-1">Este colaborador ainda não possui solicitações</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum resultado</p>
                <p className="text-sm mt-1">Nenhuma solicitação corresponde aos filtros</p>
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                  Limpar filtros
                </Button>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 transition-colors hover:border-border/80 hover:bg-accent/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {request.protocol}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(request.created_at)}
                    </span>
                  </div>

                  <div className="text-sm font-medium text-foreground">
                    {benefitTypeLabels[request.benefit_type]}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={request.status} />

                    {request.approved_value && (
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        R$ {request.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  {(request.status === 'aprovada' || request.status === 'concluida') &&
                   request.total_installments && request.total_installments > 1 && (
                    <div className="flex items-center justify-between gap-2 rounded-md bg-primary/5 border border-primary/20 p-3 mt-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-foreground">Parcelas: </span>
                          <span className={`font-semibold ${
                            (request.paid_installments || 0) >= request.total_installments
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-primary'
                          }`}>
                            {request.paid_installments || 0}/{request.total_installments}
                          </span>
                          {request.approved_value && (
                            <span className="text-muted-foreground ml-2">
                              (R$ {(request.approved_value / request.total_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês)
                            </span>
                          )}
                        </div>
                      </div>
                      {(request.paid_installments || 0) < request.total_installments && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          disabled={updatingInstallment === request.id}
                          onClick={() => handlePayInstallment(
                            request.id,
                            request.paid_installments || 0,
                            request.total_installments || 1
                          )}
                        >
                          <Check className="h-3 w-3" />
                          Pagar
                        </Button>
                      )}
                      {(request.paid_installments || 0) >= request.total_installments && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Quitado
                        </Badge>
                      )}
                    </div>
                  )}

                  {(request.status === 'concluida' || request.status === 'aprovada') && request.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      onClick={() => window.open(request.pdf_url!, '_blank')}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span>Visualizar PDF</span>
                    </Button>
                  )}

                  {request.status === 'recusada' && request.rejection_reason && (
                    <div className="flex items-start gap-2.5 rounded-md bg-destructive/10 border border-destructive/20 p-3 mt-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm min-w-0">
                        <span className="font-medium text-destructive">Motivo:</span>
                        <p className="text-destructive/80 mt-0.5 break-words">{request.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  {request.status === 'aprovada' && !request.pdf_url && (
                    <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-3 mt-2">
                      <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-sm text-amber-700 dark:text-amber-300">Aprovado - Aguardando PDF</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
