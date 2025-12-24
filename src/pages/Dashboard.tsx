import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import BenefitsChart from '@/components/dashboard/BenefitsChart';
import BenefitTypeChart from '@/components/dashboard/BenefitTypeChart';
import BenefitCategoryCards from '@/components/dashboard/BenefitCategoryCards';
import { mockDashboardStats, mockBeneficiosPorTipo } from '@/lib/mockData';
import { formatCurrency } from '@/lib/formatters';
import { Users, Gift, Clock, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos benefícios da empresa
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Colaboradores"
            value={mockDashboardStats.totalColaboradores}
            icon={Users}
            trend={{ value: 5, positive: true }}
          />
          <StatCard
            title="Tipos de Benefícios"
            value={mockDashboardStats.totalBeneficios}
            icon={Gift}
          />
          <StatCard
            title="Solicitações Pendentes"
            value={mockDashboardStats.solicitacoesPendentes}
            icon={Clock}
            trend={{ value: 12, positive: false }}
          />
          <StatCard
            title="Valor Total em Benefícios"
            value={formatCurrency(mockDashboardStats.valorTotalBeneficios)}
            icon={DollarSign}
            trend={{ value: 8, positive: true }}
          />
        </div>

        <BenefitCategoryCards data={mockBeneficiosPorTipo} />

        <div className="grid gap-4 md:grid-cols-2">
          <BenefitsChart data={mockBeneficiosPorTipo} />
          <BenefitTypeChart data={mockBeneficiosPorTipo} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
