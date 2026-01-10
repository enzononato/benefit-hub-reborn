import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, any> | null;
  user_id: string | null;
  created_at: string;
  user_name?: string;
}

export function exportAuditLogsToCSV(
  logs: AuditLog[],
  actionLabels: Record<string, string>,
  entityTypeLabels: Record<string, string>
): void {
  const headers = ['Data/Hora', 'Ação', 'Tipo de Entidade', 'Usuário', 'Detalhes'];
  
  const rows = logs.map(log => {
    const dateFormatted = format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
    const actionLabel = actionLabels[log.action] || log.action;
    const entityLabel = log.entity_type ? (entityTypeLabels[log.entity_type] || log.entity_type) : '-';
    const userName = log.user_name || '-';
    const details = log.details ? JSON.stringify(log.details) : '-';
    
    return [dateFormatted, actionLabel, entityLabel, userName, details];
  });

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `auditoria_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
