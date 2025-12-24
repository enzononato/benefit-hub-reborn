import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Loader2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentData {
  name: string;
  initials: string;
  atendidas: number;
  aprovadas: number;
  recusadas: number;
}

const GRADIENTS = [
  { start: 'hsl(var(--primary))', end: 'hsl(var(--primary) / 0.7)' },
  { start: 'hsl(var(--chart-2))', end: 'hsl(var(--chart-2) / 0.7)' },
  { start: 'hsl(var(--chart-3))', end: 'hsl(var(--chart-3) / 0.7)' },
  { start: 'hsl(var(--chart-4))', end: 'hsl(var(--chart-4) / 0.7)' },
  { start: 'hsl(var(--chart-5))', end: 'hsl(var(--chart-5) / 0.7)' },
];

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-chart-2 text-white',
  'bg-chart-3 text-white',
  'bg-chart-4 text-white',
  'bg-chart-5 text-white',
];

export function AgentPerformanceChart() {
  const [data, setData] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAgentData(); }, []);

  const fetchAgentData = async () => {
    try {
      const { data: requests, error } = await supabase.from('benefit_requests').select('reviewed_by, status').not('reviewed_by', 'is', null);
      if (error || !requests?.length) { setData([]); setLoading(false); return; }

      const agentMap = new Map<string, { atendidas: number; aprovadas: number; recusadas: number }>();
      requests.forEach((req) => {
        if (!req.reviewed_by) return;
        const current = agentMap.get(req.reviewed_by) || { atendidas: 0, aprovadas: 0, recusadas: 0 };
        current.atendidas++;
        if (req.status === 'aprovada' || req.status === 'concluida') current.aprovadas++;
        else if (req.status === 'recusada') current.recusadas++;
        agentMap.set(req.reviewed_by, current);
      });

      const agentIds = Array.from(agentMap.keys());
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', agentIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const chartData: AgentData[] = Array.from(agentMap.entries())
        .map(([userId, stats]) => {
          const fullName = profileMap.get(userId) || 'Desconhecido';
          const nameParts = fullName.split(' ');
          return { name: nameParts[0], initials: nameParts.map(n => n[0]).join('').slice(0, 2).toUpperCase(), ...stats };
        })
        .sort((a, b) => b.atendidas - a.atendidas)
        .slice(0, 5);

      setData(chartData);
    } catch { }
    setLoading(false);
  };

  const totalAtendidas = data.reduce((sum, d) => sum + d.atendidas, 0);
  const totalAprovadas = data.reduce((sum, d) => sum + d.aprovadas, 0);
  const totalRecusadas = data.reduce((sum, d) => sum + d.recusadas, 0);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-4 w-4 text-primary" /></div>
            Desempenho por Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-4 w-4 text-primary" /></div>
            Desempenho por Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[320px]">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3"><TrendingUp className="h-8 w-8 text-muted-foreground/50" /></div>
            <p className="text-muted-foreground text-sm font-medium">Nenhum atendimento registrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-4 w-4 text-primary" /></div>
          Desempenho por Agente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {data.map((agent, index) => {
            const percentage = totalAtendidas > 0 ? (agent.atendidas / totalAtendidas) * 100 : 0;
            const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];

            return (
              <div key={agent.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm", colorClass)}>{agent.initials}</div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{agent.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-success" />{agent.aprovadas}</span>
                        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{agent.recusadas}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{agent.atendidas}</p>
                    <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${percentage}%`, background: `linear-gradient(90deg, ${GRADIENTS[index % GRADIENTS.length].start}, ${GRADIENTS[index % GRADIENTS.length].end})` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{totalAtendidas}</p><p className="text-xs text-muted-foreground font-medium">Total</p></div>
          <div className="text-center p-3 rounded-lg bg-success/10"><p className="text-2xl font-bold text-success">{totalAprovadas}</p><p className="text-xs text-muted-foreground font-medium">Aprovadas</p></div>
          <div className="text-center p-3 rounded-lg bg-destructive/10"><p className="text-2xl font-bold text-destructive">{totalRecusadas}</p><p className="text-xs text-muted-foreground font-medium">Recusadas</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
