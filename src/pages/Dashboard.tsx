import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Clock, CheckCircle, XCircle, FolderOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitType } from '@/types/benefits';
import { benefitTypes } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

const filteredBenefitTypes = benefitTypes.filter(t => t !== 'outros') as BenefitType[];

interface DashboardStats {
  total: number;
  today: number;
  abertos: number;
  emAnalise: number;
  aprovados: number;
  reprovados: number;
}

interface RequestData {
  status: string;
  benefit_type: string;
  user_id: string;
  created_at: string;
}

const COLORS = ['hsl(267, 83%, 57%)', 'hsl(142, 76%, 36%)', 'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(187, 85%, 43%)'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, today: 0, abertos: 0, emAnalise: 0, aprovados: 0, reprovados: 0 });
  const [benefitTypeData, setBenefitTypeData] = useState<{ type: BenefitType; count: number }[]>([]);
  const [allRequests, setAllRequests] = useState<RequestData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await supabase
        .from('benefit_requests')
        .select('status, benefit_type, user_id, created_at');

      if (error) {
        console.error('Error fetching dashboard data:', error);
        return;
      }

      const filteredData = data || [];
      setAllRequests(filteredData);

      const total = filteredData.length;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const today = filteredData.filter(r => new Date(r.created_at) >= todayStart).length;

      const abertos = filteredData.filter(r => r.status === 'aberta').length;
      const emAnalise = filteredData.filter(r => r.status === 'em_analise').length;
      const aprovados = filteredData.filter(r => r.status === 'aprovada' || r.status === 'concluida').length;
      const reprovados = filteredData.filter(r => r.status === 'recusada').length;

      setStats({ total, today, abertos, emAnalise, aprovados, reprovados });

      const typeData = filteredBenefitTypes.map(type => ({
        type,
        count: filteredData.filter(r => r.benefit_type === type).length,
      }));
      setBenefitTypeData(typeData);
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
    }
  };

  const monthlyData = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 5);

    const months: { month: string; solicitacoes: number; aprovadas: number; recusadas: number }[] = [];
    const currentDate = startOfMonth(start);
    const endMonth = startOfMonth(end);

    while (currentDate <= endMonth) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const monthRequests = allRequests.filter((req) => {
        const reqDate = new Date(req.created_at);
        return reqDate >= monthStart && reqDate <= monthEnd;
      });

      months.push({
        month: format(currentDate, 'MMM', { locale: ptBR }),
        solicitacoes: monthRequests.length,
        aprovadas: monthRequests.filter((r) => r.status === 'aprovada' || r.status === 'concluida').length,
        recusadas: monthRequests.filter((r) => r.status === 'recusada').length,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }, [allRequests]);

  const benefitLabels: Record<BenefitType, string> = {
    autoescola: 'Autoescola',
    farmacia: 'Farmácia',
    oficina: 'Oficina',
    vale_gas: 'Vale Gás',
    papelaria: 'Papelaria',
    otica: 'Ótica',
    outros: 'Outros',
  };

  const pieData = benefitTypeData.map((item, index) => ({
    name: benefitLabels[item.type],
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Dashboard
            <span className="hidden sm:inline"> - Revalle Gestão do DP</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Acompanhamento em tempo real das solicitações e análises do DP</span>
            <span className="sm:hidden">Visão geral das solicitações</span>
          </p>
        </div>

        {/* Stats Grid - 6 KPI Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total"
            value={stats.total}
            icon={FileText}
            onClick={() => navigate('/solicitacoes')}
          />
          <StatCard
            title="Hoje"
            value={stats.today}
            icon={TrendingUp}
            onClick={() => navigate('/solicitacoes')}
          />
          <StatCard
            title="Aberto"
            value={stats.abertos}
            icon={FolderOpen}
            variant="info"
            onClick={() => navigate('/solicitacoes?status=aberta')}
          />
          <StatCard
            title="Análise"
            value={stats.emAnalise}
            icon={Clock}
            variant="warning"
            onClick={() => navigate('/solicitacoes?status=em_analise')}
          />
          <StatCard
            title="Aprovadas"
            value={stats.aprovados}
            icon={CheckCircle}
            variant="success"
            onClick={() => navigate('/solicitacoes?status=aprovada,concluida')}
          />
          <StatCard
            title="Reprovadas"
            value={stats.reprovados}
            icon={XCircle}
            variant="destructive"
            onClick={() => navigate('/solicitacoes?status=recusada')}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="solicitacoes" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="aprovadas" name="Aprovadas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recusadas" name="Recusadas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitações por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
