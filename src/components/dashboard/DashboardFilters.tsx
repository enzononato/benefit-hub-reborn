import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Eraser, Filter, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { benefitTypeFilterLabels, statusFilterLabels, BenefitType, BenefitStatus } from '@/types/benefits';
import { cn } from '@/lib/utils';

export interface DashboardFilters {
  unitId: string | null;
  benefitType: BenefitType | null;
  status: BenefitStatus | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  /** null = admin/sem filtro; array = tipos permitidos */
  allowedTypes?: BenefitType[] | null;
}

interface Unit {
  id: string;
  name: string;
  code: string;
}

export function DashboardFiltersComponent({ filters, onFiltersChange, allowedTypes = null }: DashboardFiltersProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const benefitTypeOptions = (Object.keys(benefitTypeFilterLabels) as BenefitType[]).filter((type) =>
    allowedTypes === null ? true : allowedTypes.includes(type)
  );

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('units').select('*').order('name');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, []);

  const clearFilters = () => {
    onFiltersChange({ unitId: null, benefitType: null, status: null, startDate: null, endDate: null });
  };

  const activeFilters: { key: keyof DashboardFilters; label: string }[] = [];
  if (filters.unitId) {
    const unit = units.find(u => u.id === filters.unitId);
    activeFilters.push({ key: 'unitId', label: unit?.name || 'Unidade' });
  }
  if (filters.benefitType) {
    activeFilters.push({ key: 'benefitType', label: benefitTypeFilterLabels[filters.benefitType] });
  }
  if (filters.status) {
    activeFilters.push({ key: 'status', label: statusFilterLabels[filters.status] });
  }
  if (filters.startDate) {
    activeFilters.push({ key: 'startDate', label: `De ${format(filters.startDate, 'dd/MM', { locale: ptBR })}` });
  }
  if (filters.endDate) {
    activeFilters.push({ key: 'endDate', label: `Até ${format(filters.endDate, 'dd/MM', { locale: ptBR })}` });
  }

  const hasActiveFilters = activeFilters.length > 0;

  const removeFilter = (key: keyof DashboardFilters) => {
    onFiltersChange({ ...filters, [key]: null });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="animate-fade-in">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header with toggle and active filters */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Filtros</span>
            </div>
            
            {!isOpen && hasActiveFilters && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="text-xs gap-1 pl-2 pr-1 py-0.5 cursor-pointer hover:bg-secondary/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFilter(filter.key);
                    }}
                  >
                    <span className="truncate max-w-[100px]">{filter.label}</span>
                    <X className="h-3 w-3 opacity-60 hover:opacity-100" />
                  </Badge>
                ))}
              </div>
            )}
            
            {!isOpen && !hasActiveFilters && (
              <span className="text-xs text-muted-foreground">Nenhum filtro aplicado</span>
            )}
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
              <span className="text-xs sm:text-sm">{isOpen ? 'Fechar' : 'Expandir'}</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Collapsible filter controls */}
        <CollapsibleContent>
          <div className="border-t border-border p-3 sm:p-4 bg-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              <Select value={filters.unitId || 'all'} onValueChange={(value) => onFiltersChange({ ...filters, unitId: value === 'all' ? null : value })}>
                <SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-card"><SelectValue placeholder="Unidades" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.benefitType || 'all'} onValueChange={(value) => onFiltersChange({ ...filters, benefitType: value === 'all' ? null : (value as BenefitType) })}>
                <SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-card"><SelectValue placeholder="Tipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {benefitTypeOptions.map((type) => <SelectItem key={type} value={type}>{benefitTypeFilterLabels[type]}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filters.status || 'all'} onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? null : (value as BenefitStatus) })}>
                <SelectTrigger className="w-full h-9 text-xs sm:text-sm bg-card"><SelectValue placeholder="Situação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  {(Object.keys(statusFilterLabels) as Array<keyof typeof statusFilterLabels>).map((status) => <SelectItem key={status} value={status}>{statusFilterLabels[status]}</SelectItem>)}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-9 justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 bg-card', !filters.startDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{filters.startDate ? format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filters.startDate || undefined} onSelect={(date) => onFiltersChange({ ...filters, startDate: date || null })} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full h-9 justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 bg-card', !filters.endDate && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate">{filters.endDate ? format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={filters.endDate || undefined} onSelect={(date) => onFiltersChange({ ...filters, endDate: date || null })} locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Button variant="outline" onClick={clearFilters} disabled={!hasActiveFilters} className="w-full h-9 bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs sm:text-sm px-2 sm:px-3">
                <Eraser className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Limpar</span>
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
