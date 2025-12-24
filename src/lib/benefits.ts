export const benefitTypes = [
  { id: 'saude', label: 'Saúde', color: 'hsl(var(--chart-1))' },
  { id: 'alimentacao', label: 'Alimentação', color: 'hsl(var(--chart-2))' },
  { id: 'transporte', label: 'Transporte', color: 'hsl(var(--chart-3))' },
  { id: 'educacao', label: 'Educação', color: 'hsl(var(--chart-4))' },
  { id: 'outros', label: 'Outros', color: 'hsl(var(--chart-5))' },
] as const;

export const getBenefitLabel = (tipo: string): string => {
  const benefit = benefitTypes.find(b => b.id === tipo);
  return benefit?.label || tipo;
};

export const getBenefitColor = (tipo: string): string => {
  const benefit = benefitTypes.find(b => b.id === tipo);
  return benefit?.color || 'hsl(var(--muted))';
};

export const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
};

export const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  aprovada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejeitada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};
