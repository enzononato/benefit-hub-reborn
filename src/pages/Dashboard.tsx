import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import BenefitsChart from '@/components/dashboard/BenefitsChart';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BenefitTypeChart from '@/components/dashboard/BenefitTypeChart';
import BenefitCategoryCards from '@/components/dashboard/BenefitCategoryCards';

import { RecentRequests } from '@/components/dashboard/RecentRequests';
import { AgentPerformanceChart } from '@/components/dashboard/AgentPerformanceChart';
import { DashboardFiltersComponent, DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { FileText, Clock, CheckCircle, XCircle, FolderOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitType } from '@/types/benefits';
import { benefitTypes } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const allBenefitTypes = benefitTypes as BenefitType[];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { userModules, userName } = useAuth();

  // Garante que só tipos válidos do enum cheguem no Dashboard (remove agregados tipo "convenios")
  const allowedBenefitTypes = useMemo(() => {
    if (userModules === null) return null; // admin
    return (userModules ?? []).filter((m): m is BenefitType => allBenefitTypes.includes(m as BenefitType));
  }, [userModules]);

  const [stats, setStats] = useState<DashboardStats>({ total: 0, today: 0, abertos: 0, emAnalise: 0, aprovados: 0, reprovados: 0 });
  const [benefitTypeData, setBenefitTypeData] = useState<{ type: BenefitType; count: number }[]>([]);
  const [allRequests, setAllRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({
    unitId: null,
    benefitType: null,
    status: null,
    startDate: null,
    endDate: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // If user has no modules configured (empty array), show empty dashboard
      if (allowedBenefitTypes !== null && allowedBenefitTypes.length === 0) {
        setAllRequests([]);
        setStats({ total: 0, today: 0, abertos: 0, emAnalise: 0, aprovados: 0, reprovados: 0 });
        setBenefitTypeData([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('benefit_requests')
        .select('status, benefit_type, user_id, created_at');

      // Filter by user's allowed modules (if not admin)
      if (allowedBenefitTypes !== null) {
        query = query.in('benefit_type', allowedBenefitTypes);
      }

      if (filters.benefitType) {
        query = query.eq('benefit_type', filters.benefitType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
        return;
      }

      let filteredData = data || [];

      if (filters.unitId && filteredData.length > 0) {
        const userIds = [...new Set(filteredData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('unit_id', filters.unitId)
          .in('user_id', userIds);

        const validUserIds = new Set(profilesData?.map(p => p.user_id) || []);
        filteredData = filteredData.filter(r => validUserIds.has(r.user_id));
      }

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

      const typeData = allBenefitTypes.map(type => ({
        type,
        count: filteredData.filter(r => r.benefit_type === type).length,
      }));
      setBenefitTypeData(typeData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
    }
    setLoading(false);
  }, [allowedBenefitTypes, filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (allowedBenefitTypes !== null && filters.benefitType && !allowedBenefitTypes.includes(filters.benefitType)) {
      setFilters((prev) => ({ ...prev, benefitType: null }));
    }
  }, [allowedBenefitTypes, filters.benefitType]);

  const monthlyData = useMemo(() => {
    const end = filters.endDate || new Date();
    const start = filters.startDate || subMonths(end, 5);

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
  }, [allRequests, filters.startDate, filters.endDate]);

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <DashboardHeader 
          userName={userName || undefined} 
          onRefresh={fetchDashboardData} 
          isLoading={loading}
          lastUpdate={lastUpdate}
        />

        <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} allowedTypes={allowedBenefitTypes} />

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard 
            title="Total" 
            value={stats.total} 
            icon={FileText} 
            onClick={() => navigate('/solicitacoes')} 
            loading={loading}
            tooltip="Total de solicitações no período"
          />
          <StatCard 
            title="Hoje" 
            value={stats.today} 
            icon={TrendingUp} 
            onClick={() => navigate('/solicitacoes')} 
            loading={loading}
            tooltip="Novas solicitações criadas hoje"
          />
          <StatCard 
            title="Aberto" 
            value={stats.abertos} 
            icon={FolderOpen} 
            variant="info" 
            onClick={() => navigate('/solicitacoes?status=aberta')} 
            loading={loading}
            tooltip="Aguardando atendimento"
          />
          <StatCard 
            title="Análise" 
            value={stats.emAnalise} 
            icon={Clock} 
            variant="warning" 
            onClick={() => navigate('/solicitacoes?status=em_analise')} 
            loading={loading}
            tooltip="Em análise pelo agente"
          />
          <StatCard 
            title="Aprovadas" 
            value={stats.aprovados} 
            icon={CheckCircle} 
            variant="success" 
            onClick={() => navigate('/solicitacoes?status=aprovada')} 
            loading={loading}
            tooltip="Solicitações aprovadas"
          />
          <StatCard 
            title="Reprovadas" 
            value={stats.reprovados} 
            icon={XCircle} 
            variant="destructive" 
            onClick={() => navigate('/solicitacoes?status=recusada')} 
            loading={loading}
            tooltip="Solicitações recusadas"
          />
        </div>

        <BenefitCategoryCards data={benefitTypeData} allowedTypes={allowedBenefitTypes} />

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <BenefitsChart data={monthlyData} />
          <BenefitTypeChart data={benefitTypeData} />
        </div>

        <AgentPerformanceChart />
        <RecentRequests />
      </div>
    </MainLayout>
  );
}
