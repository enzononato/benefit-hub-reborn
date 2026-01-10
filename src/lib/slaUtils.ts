/**
 * Utilitário para cálculo de horas úteis de SLA
 * 
 * Regras:
 * - Sábados após 12h não contam
 * - Domingos inteiros não contam
 */

/**
 * Calcula horas úteis entre duas datas, excluindo:
 * - Sábados após 12h (a partir das 12:00)
 * - Domingos inteiros
 */
export function calculateBusinessHours(startDate: Date, endDate: Date): number {
  let hours = 0;
  const current = new Date(startDate);
  
  // Arredondar para a hora cheia para evitar problemas de precisão
  current.setMinutes(0, 0, 0);
  
  while (current < endDate) {
    const dayOfWeek = current.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = current.getHours();
    
    const isSunday = dayOfWeek === 0;
    const isSaturdayAfternoon = dayOfWeek === 6 && hour >= 12;
    
    // Só conta a hora se NÃO for domingo e NÃO for sábado após 12h
    if (!isSunday && !isSaturdayAfternoon) {
      hours++;
    }
    
    // Avança 1 hora
    current.setHours(current.getHours() + 1);
  }
  
  return hours;
}

/**
 * Retorna o status do SLA baseado nas horas úteis decorridas
 */
export interface SlaStatusResult {
  status: 'green' | 'yellow' | 'red' | 'no-config';
  label: string;
  dotColor: string;
  businessHours: number;
}

export function getSlaStatusFromConfig(
  createdAt: string | Date,
  greenHours: number,
  yellowHours: number
): SlaStatusResult {
  const businessHours = calculateBusinessHours(
    new Date(createdAt),
    new Date()
  );

  if (businessHours <= greenHours) {
    return { 
      status: 'green', 
      label: `${businessHours}h`, 
      dotColor: 'bg-success',
      businessHours 
    };
  } else if (businessHours <= yellowHours) {
    return { 
      status: 'yellow', 
      label: `${businessHours}h`, 
      dotColor: 'bg-warning',
      businessHours 
    };
  } else {
    return { 
      status: 'red', 
      label: `${businessHours}h`, 
      dotColor: 'bg-destructive',
      businessHours 
    };
  }
}
