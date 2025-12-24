import { Colaborador, Solicitacao, DashboardStats, BeneficiosPorTipo } from '@/types';

export const mockColaboradores: Colaborador[] = [
  {
    id: '1',
    nome: 'João Silva',
    cpf: '123.456.789-00',
    email: 'joao.silva@empresa.com',
    telefone: '(11) 99999-0001',
    departamento: 'TI',
    cargo: 'Desenvolvedor',
    data_admissao: '2022-01-15',
    salario: 8500,
    status: 'ativo',
  },
  {
    id: '2',
    nome: 'Maria Santos',
    cpf: '987.654.321-00',
    email: 'maria.santos@empresa.com',
    telefone: '(11) 99999-0002',
    departamento: 'RH',
    cargo: 'Analista de RH',
    data_admissao: '2021-06-01',
    salario: 6000,
    status: 'ativo',
  },
  {
    id: '3',
    nome: 'Carlos Oliveira',
    cpf: '456.789.123-00',
    email: 'carlos.oliveira@empresa.com',
    telefone: '(11) 99999-0003',
    departamento: 'Financeiro',
    cargo: 'Contador',
    data_admissao: '2020-03-10',
    salario: 7500,
    status: 'ativo',
  },
];

export const mockSolicitacoes: Solicitacao[] = [
  {
    id: '1',
    colaborador_id: '1',
    beneficio_id: '1',
    tipo_beneficio: 'saude',
    status: 'pendente',
    valor: 500,
    data_solicitacao: '2024-01-15',
    observacao: 'Inclusão de dependente no plano de saúde',
  },
  {
    id: '2',
    colaborador_id: '2',
    beneficio_id: '2',
    tipo_beneficio: 'alimentacao',
    status: 'aprovada',
    valor: 800,
    data_solicitacao: '2024-01-10',
    data_resposta: '2024-01-12',
  },
  {
    id: '3',
    colaborador_id: '3',
    beneficio_id: '3',
    tipo_beneficio: 'transporte',
    status: 'rejeitada',
    valor: 300,
    data_solicitacao: '2024-01-08',
    data_resposta: '2024-01-09',
    observacao: 'Documentação incompleta',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalColaboradores: 150,
  totalBeneficios: 5,
  solicitacoesPendentes: 23,
  valorTotalBeneficios: 125000,
};

export const mockBeneficiosPorTipo: BeneficiosPorTipo[] = [
  { tipo: 'saude', quantidade: 120, valor: 60000 },
  { tipo: 'alimentacao', quantidade: 145, valor: 43500 },
  { tipo: 'transporte', quantidade: 100, valor: 15000 },
  { tipo: 'educacao', quantidade: 25, valor: 5000 },
  { tipo: 'outros', quantidade: 10, valor: 1500 },
];
