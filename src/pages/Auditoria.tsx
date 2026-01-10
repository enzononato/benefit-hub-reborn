import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuditoria, AuditLog } from '@/hooks/useAuditoria';
import { AuditStats } from '@/components/auditoria/AuditStats';
import { AuditLogSheet } from '@/components/auditoria/AuditLogSheet';
import { PaginationControls } from '@/components/ui/pagination-controls';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, RefreshCw, FileText, CalendarIcon, X, Filter, Download,
  Plus, Trash2, Edit, UserCog, FileX, Clock
} from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { exportAuditLogsToCSV } from '@/lib/exportUtils';
import { toast } from 'sonner';

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

const actionIcons: Record<string, React.ReactNode> = {
  benefit_request_created: <Plus className="h-3 w-3" />,
  benefit_request_status_changed: <Edit className="h-3 w-3" />,
  benefit_request_deleted: <Trash2 className="h-3 w-3" />,
  profile_updated_by_admin: <UserCog className="h-3 w-3" />,
  profile_deleted: <Trash2 className="h-3 w-3" />,
  user_role_assigned: <UserCog className="h-3 w-3" />,
  user_role_changed: <Edit className="h-3 w-3" />,
  user_role_removed: <Trash2 className="h-3 w-3" />,
  document_deleted: <FileX className="h-3 w-3" />,
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
  const [userFilter, setUserFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map((log) => log.action))].sort();
  }, [logs]);

  const uniqueUsers = useMemo(() => {
    return [...new Set(logs.map((log) => log.user_name).filter(Boolean))].sort() as string[];
  }, [logs]);

  const uniqueEntityTypes = useMemo(() => {
    return [...new Set(logs.map((log) => log.entity_type).filter(Boolean))].sort() as string[];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesUser = userFilter === 'all' || log.user_name === userFilter;
      const matchesEntityType = entityTypeFilter === 'all' || log.entity_type === entityTypeFilter;

      const matchesDate =
        !dateRange?.from ||
        isWithinInterval(new Date(log.created_at), {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to || dateRange.from),
        });

      return matchesSearch && matchesAction && matchesUser && matchesEntityType && matchesDate;
    });
  }, [logs, search, actionFilter, userFilter, entityTypeFilter, dateRange]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const clearFilters = () => {
    setSearch('');
    setActionFilter('all');
    setUserFilter('all');
    setEntityTypeFilter('all');
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const hasActiveFilters = search || actionFilter !== 'all' || userFilter !== 'all' || entityTypeFilter !== 'all' || dateRange;

  const formatDetails = (details: Record<string, any> | null) => {
    if (!details) return '-';
    
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';
    
    return entries
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setSheetOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('Nenhum log para exportar');
      return;
    }
    exportAuditLogsToCSV(filteredLogs, actionLabels, entityTypeLabels);
    toast.success(`${filteredLogs.length} logs exportados com sucesso`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const isRecentLog = (createdAt: string) => {
    return differenceInHours(new Date(), new Date(createdAt)) < 1;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
            <p className="mt-1 text-muted-foreground">
              Logs e auditoria do sistema ({filteredLogs.length} de {logs.length} registros)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <AuditStats logs={logs} actionLabels={actionLabels} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nos logs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Ação" />
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

            <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entityTypeFilter} onValueChange={(v) => { setEntityTypeFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {uniqueEntityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {entityTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                  onSelect={(range) => { setDateRange(range); setCurrentPage(1); }}
                  locale={ptBR}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {search && (
              <Badge variant="secondary" className="gap-1">
                Busca: "{search}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearch('')} />
              </Badge>
            )}
            {actionFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Ação: {actionLabels[actionFilter] || actionFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setActionFilter('all')} />
              </Badge>
            )}
            {userFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Usuário: {userFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setUserFilter('all')} />
              </Badge>
            )}
            {entityTypeFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Tipo: {entityTypeLabels[entityTypeFilter] || entityTypeFilter}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setEntityTypeFilter('all')} />
              </Badge>
            )}
            {dateRange?.from && (
              <Badge variant="secondary" className="gap-1">
                Período: {format(dateRange.from, 'dd/MM')} - {dateRange.to ? format(dateRange.to, 'dd/MM') : format(dateRange.from, 'dd/MM')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setDateRange(undefined)} />
              </Badge>
            )}
          </div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      {hasActiveFilters ? 'Nenhum log encontrado com os filtros aplicados' : 'Nenhum log registrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleRowClick(log)}
                    >
                      <TableCell className="text-center">
                        {isRecentLog(log.created_at) && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Clock className="h-4 w-4 text-primary animate-pulse" />
                            </TooltipTrigger>
                            <TooltipContent>Ação recente (última hora)</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('font-normal gap-1', actionColors[log.action] || 'bg-muted text-muted-foreground')}
                        >
                          {actionIcons[log.action]}
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.entity_type ? entityTypeLabels[log.entity_type] || log.entity_type : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{log.user_name || '-'}</TableCell>
                      <TableCell className="max-w-md">
                        <Tooltip>
                          <TooltipTrigger className="text-left">
                            <span className="block truncate text-sm text-muted-foreground max-w-[300px]">
                              {formatDetails(log.details)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-md">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Details Sheet */}
      <AuditLogSheet
        log={selectedLog}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        actionLabels={actionLabels}
        actionColors={actionColors}
        entityTypeLabels={entityTypeLabels}
      />
    </MainLayout>
  );
}
