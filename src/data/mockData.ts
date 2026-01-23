// This file contains helper functions for dashboard statistics
// Data is now primarily fetched from Supabase

import { BenefitType, BenefitStatus } from '@/types/benefits';

// Helper types for dashboard
export interface DashboardStats {
  total: number;
  abertos: number;
  emAnalise: number;
  aprovados: number;
  reprovados: number;
}

export interface MonthlyData {
  month: string;
  solicitacoes: number;
  aprovadas: number;
}

export interface BenefitTypeData {
  type: BenefitType;
  count: number;
}

export interface PaymentReceipt {
  id: string;
  userId: string;
  month: string;
  year: number;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  benefits: number;
  pdfUrl: string;
  createdAt: Date;
}

// Generate monthly chart data
export const getMonthlyData = (): MonthlyData[] => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months.map((month) => ({
    month,
    solicitacoes: Math.floor(Math.random() * 20) + 5,
    aprovadas: Math.floor(Math.random() * 15) + 3,
  }));
};

// Benefit types list - Convênios
export const convenioTypes: BenefitType[] = ['autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'];

// Benefit types list - Solicitações DP
export const dpTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'alteracao_horario', 'operacao_domingo', 'relatorio_ponto',
  'plano_odontologico', 'plano_saude', 'vale_transporte', 'relato_anomalia'
];

// Benefit types list - Outros
export const outrosTypes: BenefitType[] = [
  'listagem_funcionarios', 'listagem_aniversariantes', 'listagem_dependentes',
  'listagem_pdcs', 'informacoes_diversas'
];

// All benefit types (for backward compatibility)
export const benefitTypes: BenefitType[] = [...convenioTypes, ...dpTypes, ...outrosTypes];

// Status list (sem concluida na UI)
export const statuses: BenefitStatus[] = ['aberta', 'em_analise', 'aprovada', 'recusada'];
