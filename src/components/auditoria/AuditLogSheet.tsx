import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar, User, FileText, Hash, Clock, Info } from 'lucide-react';

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

interface AuditLogSheetProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabels: Record<string, string>;
  actionColors: Record<string, string>;
  entityTypeLabels: Record<string, string>;
}

export function AuditLogSheet({
  log,
  open,
  onOpenChange,
  actionLabels,
  actionColors,
  entityTypeLabels,
}: AuditLogSheetProps) {
  if (!log) return null;

  const formatDetailValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const detailLabels: Record<string, string> = {
    protocol: 'Protocolo',
    benefit_type: 'Tipo de Benefício',
    status: 'Status',
    old_status: 'Status Anterior',
    new_status: 'Novo Status',
    full_name: 'Nome Completo',
    target_user_id: 'ID do Usuário Alvo',
    role: 'Papel',
    old_role: 'Papel Anterior',
    new_role: 'Novo Papel',
    document_type: 'Tipo de Documento',
    document_name: 'Nome do Documento',
    profile_id: 'ID do Perfil',
    user_id: 'ID do Usuário',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Log
          </SheetTitle>
          <SheetDescription>
            Informações completas do registro de auditoria
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Action Badge */}
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn(
                'text-sm px-3 py-1',
                actionColors[log.action] || 'bg-muted text-muted-foreground'
              )}
            >
              {actionLabels[log.action] || log.action}
            </Badge>
            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
          </div>

          <Separator />

          {/* Date/Time */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Data e Hora
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {format(new Date(log.created_at), "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </p>
          </div>

          {/* User */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Usuário
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {log.user_name || 'Sistema'}
            </p>
            {log.user_id && (
              <p className="text-xs text-muted-foreground/70 pl-6 font-mono">
                ID: {log.user_id}
              </p>
            )}
          </div>

          {/* Entity Type */}
          {log.entity_type && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-muted-foreground" />
                Tipo de Entidade
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {entityTypeLabels[log.entity_type] || log.entity_type}
              </p>
            </div>
          )}

          {/* Entity ID */}
          {log.entity_id && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4 text-muted-foreground" />
                ID da Entidade
              </div>
              <p className="text-xs text-muted-foreground pl-6 font-mono break-all">
                {log.entity_id}
              </p>
            </div>
          )}

          <Separator />

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Detalhes da Ação
            </div>
            
            {log.details && Object.keys(log.details).length > 0 ? (
              <div className="space-y-2 pl-6">
                {Object.entries(log.details).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {detailLabels[key] || key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm break-all">
                      {formatDetailValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-6">
                Nenhum detalhe adicional disponível
              </p>
            )}
          </div>

          {/* Log ID */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Hash className="h-4 w-4" />
              ID do Log
            </div>
            <p className="text-xs text-muted-foreground/70 pl-6 font-mono break-all">
              {log.id}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
