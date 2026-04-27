import { cn } from '@/lib/utils';
import { BenefitStatus, statusLabels } from '@/types/benefits';

interface StatusBadgeProps {
  status: BenefitStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<BenefitStatus, { dot: string; text: string; bg: string }> = {
  aberta: {
    dot: 'bg-info',
    text: 'text-info',
    bg: 'bg-info/10 border-info/20',
  },
  em_analise: {
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
  },
  aprovada: {
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10 border-success/20',
  },
  recusada: {
    dot: 'bg-destructive',
    text: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums',
        config.bg,
        config.text,
        className
      )}
    >
      {showIcon && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {statusLabels[status]}
    </span>
  );
}
