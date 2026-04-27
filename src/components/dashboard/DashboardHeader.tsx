import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  userName?: string;
  onRefresh: () => void;
  isLoading?: boolean;
  lastUpdate?: Date | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardHeader({ userName, onRefresh, isLoading, lastUpdate }: DashboardHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const firstName = userName?.split(' ')[0] || '';
  const today = new Date();

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          <span className="capitalize">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
          {lastUpdate && (
            <>
              <span className="mx-1.5 text-muted-foreground/50">·</span>
              <span>Atualizado às {format(lastUpdate, 'HH:mm')}</span>
            </>
          )}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading || isRefreshing}
        className="gap-1.5"
      >
        <RefreshCw className={cn(
          "h-3.5 w-3.5 transition-transform",
          (isLoading || isRefreshing) && "animate-spin"
        )} />
        <span>Atualizar</span>
      </Button>
    </div>
  );
}
