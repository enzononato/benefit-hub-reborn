import { cn } from '@/lib/utils';
import { BenefitStatus, statusLabels } from '@/types/benefits';
import { Clock, Search, CheckCircle, XCircle, Trophy } from 'lucide-react';

interface StatusBadgeProps {
  status: BenefitStatus;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<BenefitStatus, {
  styles: string;
  icon: React.ElementType;
}> = {
  aberta: {
    styles: 'bg-info/15 text-info border-info/30',
    icon: Clock,
  },
  em_analise: {
    styles: 'bg-warning/15 text-warning border-warning/30',
    icon: Search,
  },
  aprovada: {
    styles: 'bg-success/15 text-success border-success/30',
    icon: CheckCircle,
  },
  recusada: {
    styles: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: XCircle,
  },
  concluida: {
    styles: 'bg-success/15 text-success border-success/30',
    icon: Trophy,
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      config.styles,
      className
    )}>
      {showIcon && <Icon className="h-3 w-3" />}
      {statusLabels[status]}
    </span>
  );
}
