import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tags, Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  benefitTypeLabels,
  BenefitType,
} from '@/types/benefits';
import {
  convenioTypes,
  dpTypes,
  outrosTypes,
} from '@/data/mockData';

interface BenefitTypesFilterProps {
  selected: BenefitType[];
  onChange: (next: BenefitType[]) => void;
  allowedTypes?: BenefitType[] | null; // null = admin (todos)
  className?: string;
  showSelectedChips?: boolean;
}

const GROUPS: { key: string; label: string; types: BenefitType[] }[] = [
  { key: 'convenios', label: 'Convênios', types: convenioTypes },
  { key: 'dp', label: 'Solicitações DP', types: dpTypes },
  { key: 'outros', label: 'Outros', types: outrosTypes },
];

export const BenefitTypesFilter: React.FC<BenefitTypesFilterProps> = ({
  selected,
  onChange,
  allowedTypes,
  className,
  showSelectedChips = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allowedSet = useMemo(
    () => (allowedTypes ? new Set(allowedTypes) : null),
    [allowedTypes]
  );

  const visibleGroups = useMemo(() => {
    return GROUPS.map((g) => ({
      ...g,
      types: g.types.filter((t) => {
        if (allowedSet && !allowedSet.has(t)) return false;
        if (!query.trim()) return true;
        return benefitTypeLabels[t]
          ?.toLowerCase()
          .includes(query.toLowerCase());
      }),
    })).filter((g) => g.types.length > 0);
  }, [allowedSet, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (t: BenefitType) => {
    const next = new Set(selectedSet);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    onChange(Array.from(next));
  };

  const toggleGroup = (types: BenefitType[]) => {
    const allSelected = types.every((t) => selectedSet.has(t));
    const next = new Set(selectedSet);
    if (allSelected) {
      types.forEach((t) => next.delete(t));
    } else {
      types.forEach((t) => next.add(t));
    }
    onChange(Array.from(next));
  };

  const clearAll = () => onChange([]);

  const triggerLabel =
    selected.length === 0
      ? 'Tipos'
      : selected.length === 1
      ? benefitTypeLabels[selected[0]]
      : `${selected.length} tipos`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-9 justify-start gap-1.5 text-[13px] font-normal',
              selected.length > 0 && 'text-foreground',
              selected.length === 0 && 'text-muted-foreground'
            )}
          >
            <Tags className="h-3.5 w-3.5" />
            <span className="truncate">{triggerLabel}</span>
            {selected.length > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums">
                {selected.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[320px] p-0 max-h-[420px] flex flex-col"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar tipo..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-8 text-[13px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {visibleGroups.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                Nenhum tipo encontrado.
              </p>
            ) : (
              visibleGroups.map((group) => {
                const allSelected = group.types.every((t) =>
                  selectedSet.has(t)
                );
                const someSelected =
                  !allSelected &&
                  group.types.some((t) => selectedSet.has(t));
                return (
                  <div key={group.key} className="space-y-1.5">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.types)}
                        className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        {allSelected
                          ? 'Limpar grupo'
                          : someSelected
                          ? 'Selecionar restantes'
                          : 'Selecionar todos'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {group.types.map((t) => {
                        const active = selectedSet.has(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggle(t)}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                              active
                                ? 'border-foreground bg-foreground text-background'
                                : 'border-border bg-card text-foreground hover:bg-muted/60'
                            )}
                          >
                            {active && <Check className="h-3 w-3" />}
                            {benefitTypeLabels[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border p-2">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {selected.length} selecionado{selected.length === 1 ? '' : 's'}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={clearAll}
                disabled={selected.length === 0}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => setOpen(false)}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {showSelectedChips && selected.length > 0 && (
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap pb-1 -mx-0.5 px-0.5 scrollbar-thin">
          {selected.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted/70"
              title="Remover filtro"
            >
              {benefitTypeLabels[t]}
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BenefitTypesFilter;
