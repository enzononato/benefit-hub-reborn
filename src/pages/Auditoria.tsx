import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuditoria } from '@/hooks/useAuditoria';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, FileText, CalendarIcon, X, Filter } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const actionLabels: Record<string, string> = {
  benefit_request_created: 'Solicitação criada',
  benefit_request_status_changed: 'Status alterado',
  benefit_request_deleted: 'Solicitação excluída',
  profile_updated_by_admin: 'Perfil atualizado',
  profile_deleted: 'Perfil excluído',
  user_role_assigned: 'Papel atribuído',
  user_role_changed: 'Papel alterado',
  user_role_removed: 'Papel removido',
  document_deleted: 'Documento excluído',
};

const actionColors: Record<string, string> = {
  benefit_request_created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  benefit_request_status_changed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  benefit_request_deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  profile_updated_by_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  profile_deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  user_role_assigned: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  user_role_changed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  user_role_removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  document_deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const entityTypeLabels: Record<string, string> = {
  benefit_request: 'Solicitação',
  profile: 'Perfil',
  user_role: 'Papel de Usuário',
  collaborator_document: 'Documento',
};

export default function Auditoria() {
  const { logs, loading, fetchLogs } = useAuditoria();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map((log) => log.action))].sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      const matchesDate =
        !dateRange?.from ||
        isWithinInterval(new Date(log.created_at), {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to || dateRange.from),
        });

      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, search, actionFilter, dateRange]);

  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setDateRange(undefined);
  };

  const hasActiveFilters = search || actionFilter !== 'all' || dateRange;

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return '-';
    
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';
    
    return entries
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
            <p className="mt-1 text-muted-foreground">
              Logs e auditoria do sistema ({logs.length} registros)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Atualizar
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabels[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(dateRange && 'border-primary')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy')
                  )
                ) : (
                  'Período'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                locale={ptBR}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    {hasActiveFilters ? 'Nenhum log encontrado com os filtros aplicados' : 'Nenhum log registrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('font-normal', actionColors[log.action] || 'bg-muted text-muted-foreground')}
                      >
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.entity_type ? entityTypeLabels[log.entity_type] || log.entity_type : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{log.user_name || '-'}</TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {formatDetails(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
