import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Trash2, User, TrendingUp } from 'lucide-react';
import { isToday } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  user_name?: string;
}

interface AuditStatsProps {
  logs: AuditLog[];
  actionLabels: Record<string, string>;
}

export function AuditStats({ logs, actionLabels }: AuditStatsProps) {
  const stats = useMemo(() => {
    const todayLogs = logs.filter(log => isToday(new Date(log.created_at)));
    
    const criticalActions = logs.filter(log => 
      log.action.includes('deleted') || log.action.includes('removed')
    ).length;

    // Most active user
    const userCounts = logs.reduce((acc, log) => {
      const name = log.user_name || 'Sistema';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostActiveUser = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // Most frequent action
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentAction = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      todayCount: todayLogs.length,
      criticalCount: criticalActions,
      mostActiveUser: mostActiveUser ? { name: mostActiveUser[0], count: mostActiveUser[1] } : null,
      mostFrequentAction: mostFrequentAction 
        ? { action: actionLabels[mostFrequentAction[0]] || mostFrequentAction[0], count: mostFrequentAction[1] }
        : null,
    };
  }, [logs, actionLabels]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ações Hoje</p>
              <p className="text-2xl font-bold">{stats.todayCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ações Críticas</p>
              <p className="text-2xl font-bold">{stats.criticalCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Mais Ativo</p>
              <p className="text-base font-semibold truncate">
                {stats.mostActiveUser?.name || '-'}
              </p>
              {stats.mostActiveUser && (
                <p className="text-xs text-muted-foreground">{stats.mostActiveUser.count} ações</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">Ação Frequente</p>
              <p className="text-base font-semibold truncate">
                {stats.mostFrequentAction?.action || '-'}
              </p>
              {stats.mostFrequentAction && (
                <p className="text-xs text-muted-foreground">{stats.mostFrequentAction.count} vezes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
