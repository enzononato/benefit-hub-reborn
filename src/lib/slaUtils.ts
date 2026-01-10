/**
 * Utilitário para cálculo de horas úteis de SLA
 * 
 * Regras:
 * - Sábados após 12h não contam
 * - Domingos inteiros não contam
 * - Feriados cadastrados não contam (dia inteiro)
 */

/**
 * Formata uma data para o formato YYYY-MM-DD para comparação com feriados
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula horas úteis entre duas datas, excluindo:
 * - Sábados após 12h (a partir das 12:00)
 * - Domingos inteiros
 * - Feriados cadastrados (dia inteiro)
 * 
 * @param startDate Data de início
 * @param endDate Data de fim
 * @param holidayDates Set com datas de feriados no formato YYYY-MM-DD
 */
export function calculateBusinessHours(
  startDate: Date, 
  endDate: Date, 
  holidayDates?: Set<string>
): number {
  let hours = 0;
  const current = new Date(startDate);
  
  // Arredondar para a hora cheia para evitar problemas de precisão
  current.setMinutes(0, 0, 0);
  
  while (current < endDate) {
    const dayOfWeek = current.getDay(); // 0 = Domingo, 6 = Sábado
    const hour = current.getHours();
    const dateKey = formatDateKey(current);
    
    const isSunday = dayOfWeek === 0;
    const isSaturdayAfternoon = dayOfWeek === 6 && hour >= 12;
    const isHoliday = holidayDates?.has(dateKey) ?? false;
    
    // Só conta a hora se NÃO for domingo, NÃO for sábado após 12h e NÃO for feriado
    if (!isSunday && !isSaturdayAfternoon && !isHoliday) {
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
  yellowHours: number,
  holidayDates?: Set<string>
): SlaStatusResult {
  const businessHours = calculateBusinessHours(
    new Date(createdAt),
    new Date(),
    holidayDates
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
