import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedNumber } from './AnimatedNumber';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  onClick?: () => void;
  tooltip?: string;
  loading?: boolean;
}

const dotColor: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-muted-foreground/40',
  primary: 'bg-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
  destructive: 'bg-destructive',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', onClick, tooltip, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-3.5 shadow-elevation-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-12" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-3.5 shadow-elevation-1 transition-colors',
        onClick && 'cursor-pointer hover:border-foreground/20 hover:bg-muted/30'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColor[variant])} />
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
          </div>
          <div className="mt-1.5 text-2xl sm:text-[28px] font-semibold tabular-nums text-foreground leading-none">
            {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
          </div>
          {trend && (
            <p className={cn(
              'mt-1.5 text-[11px] font-medium tabular-nums',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
              <span className="hidden sm:inline text-muted-foreground font-normal ml-1">vs mês anterior</span>
            </p>
          )}
        </div>
        <div className="rounded-md p-1.5 shrink-0 bg-muted text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" />
        </div>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
