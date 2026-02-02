import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, UserCheck, Clock, Loader2 } from 'lucide-react';

interface HrApprovalSectionProps {
  requestId: string;
  hrStatus: string | null;
  hrReviewedBy: string | null;
  hrReviewedAt: string | null;
  hrNotes: string | null;
  userRole: 'admin' | 'gestor' | 'agente_dp' | 'rh' | 'colaborador' | null;
  isPending: boolean;
  onSuccess?: () => void;
}

export function HrApprovalSection({
  requestId,
  hrStatus,
  hrReviewedBy,
  hrReviewedAt,
  hrNotes,
  userRole,
  isPending,
  onSuccess,
}: HrApprovalSectionProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [reviewerName, setReviewerName] = useState<string | null>(null);

  // Fetch reviewer name when hrReviewedBy changes
  useEffect(() => {
    const fetchReviewerName = async () => {
      if (!hrReviewedBy) {
        setReviewerName(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', hrReviewedBy)
        .maybeSingle();

      setReviewerName(data?.full_name || 'RH');
    };

    fetchReviewerName();
  }, [hrReviewedBy]);

  const isRhUser = userRole === 'rh';
  const isDpOrGestor = userRole === 'admin' || userRole === 'gestor' || userRole === 'agente_dp';
  const isHrPending = !hrStatus || hrStatus === 'pendente';
  const isHrApproved = hrStatus === 'aprovada';
  const isHrRejected = hrStatus === 'recusada';

  const handleHrApprove = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('benefit_requests')
        .update({
          hr_status: 'aprovada',
          hr_reviewed_by: user?.id,
          hr_reviewed_at: new Date().toISOString(),
          hr_notes: notes || null,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('create_system_log', {
        p_action: 'hr_approved',
        p_entity_type: 'benefit_request',
        p_entity_id: requestId,
        p_details: { hr_notes: notes || null },
        p_user_id: user?.id,
      });

      toast.success('Solicitação aprovada pelo RH!');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao aprovar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHrReject = async () => {
    if (!notes.trim()) {
      toast.error('É necessário informar o motivo da recusa.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // RH rejects => closes the request directly
      const { error } = await supabase
        .from('benefit_requests')
        .update({
          hr_status: 'recusada',
          hr_reviewed_by: user?.id,
          hr_reviewed_at: new Date().toISOString(),
          hr_notes: notes,
          status: 'recusada',
          rejection_reason: `Recusado pelo RH: ${notes}`,
          closed_at: new Date().toISOString(),
          closed_by: user?.id,
        })
        .eq('id', requestId);

      if (error) throw error;

      // Log the action
      await supabase.rpc('create_system_log', {
        p_action: 'hr_rejected',
        p_entity_type: 'benefit_request',
        p_entity_id: requestId,
        p_details: { hr_notes: notes },
        p_user_id: user?.id,
      });

      toast.success('Solicitação recusada pelo RH.');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Erro ao recusar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // If request is already closed, don't show the section
  if (!isPending && !isHrApproved && !isHrRejected) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Aprovação RH
          </h4>
          {isHrPending && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              <Clock className="h-3 w-3 mr-1" />
              Aguardando RH
            </Badge>
          )}
          {isHrApproved && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <CheckCircle className="h-3 w-3 mr-1" />
              RH Aprovado
            </Badge>
          )}
          {isHrRejected && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <XCircle className="h-3 w-3 mr-1" />
              RH Recusado
            </Badge>
          )}
        </div>

        {/* Show reviewer info when already reviewed */}
        {!isHrPending && hrReviewedAt && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aprovado por:</span>
              <span className="font-medium">{reviewerName || 'RH'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data:</span>
              <span>{format(new Date(hrReviewedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
            {hrNotes && (
              <div className="pt-2">
                <span className="text-xs text-muted-foreground">Observações:</span>
                <p className="text-sm mt-1">{hrNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* RH user can approve/reject if pending */}
        {isRhUser && isHrPending && isPending && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hr-notes">Observações do RH</Label>
              <Textarea
                id="hr-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a análise (obrigatório para recusa)..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleHrApprove}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Aprovar RH
              </Button>
              <Button
                onClick={handleHrReject}
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Recusar RH
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Ao recusar, a solicitação será encerrada imediatamente.
            </p>
          </div>
        )}

        {/* DP/Gestor sees pending message if HR hasn't approved yet */}
        {isDpOrGestor && isHrPending && isPending && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-amber-600 mb-2" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Aguardando aprovação do RH
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Esta solicitação precisa ser aprovada pelo RH antes de poder ser finalizada.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
