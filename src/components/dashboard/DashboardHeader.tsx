import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Calendar } from 'lucide-react';
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
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const firstName = userName?.split(' ')[0] || '';
  const today = new Date();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </span>
          {lastUpdate && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-xs">
                Atualizado às {format(lastUpdate, 'HH:mm')}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="gap-2 bg-card hover:bg-accent/50"
        >
          <RefreshCw className={cn(
            "h-4 w-4 transition-transform",
            (isLoading || isRefreshing) && "animate-spin"
          )} />
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
    </div>
  );
}
