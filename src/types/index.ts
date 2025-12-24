export interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  departamento: string;
  cargo: string;
  data_admissao: string;
  salario: number;
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

export interface Beneficio {
  id: string;
  nome: string;
  tipo: 'saude' | 'alimentacao' | 'transporte' | 'educacao' | 'outros';
  valor: number;
  descricao?: string;
}

export interface Solicitacao {
  id: string;
  colaborador_id: string;
  beneficio_id: string;
  tipo_beneficio: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  valor: number;
  data_solicitacao: string;
  data_resposta?: string;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
  colaborador?: Colaborador;
  beneficio?: Beneficio;
}

export interface DashboardStats {
  totalColaboradores: number;
  totalBeneficios: number;
  solicitacoesPendentes: number;
  valorTotalBeneficios: number;
}

export interface BeneficiosPorTipo {
  tipo: string;
  quantidade: number;
  valor: number;
}
