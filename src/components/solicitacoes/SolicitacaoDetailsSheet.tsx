import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileUp,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  User,
  FileText,
  ExternalLink,
  Wallet,
  AlertCircle,
  MessageSquare,
  ClipboardList,
  Pencil,
  History,
  ArrowRight,
} from "lucide-react";
import { benefitTypeLabels, type BenefitStatus, type BenefitType } from "@/types/benefits";
import { ChatPanel } from "./ChatPanel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HrApprovalSection } from "./HrApprovalSection";
import { useAuth, AppRole } from "@/contexts/AuthContext";

interface SolicitacaoDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    protocol: string;
    user_id: string;
    benefit_type: BenefitType;
    status: BenefitStatus;
    details: string | null;
    created_at: string;
    closed_at?: string | null;
    pdf_url?: string | null;
    pdf_file_name?: string | null;
    rejection_reason?: string | null;
    closing_message?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    reviewer_name?: string | null;
    // Evolution API direct integration
    whatsapp_jid?: string | null;
    // Legacy: Chatwoot (for backward compatibility)
    account_id?: number | null;
    conversation_id?: number | null;
    approved_value?: number | null;
    total_installments?: number | null;
    paid_installments?: number | null;
    // HR approval fields
    hr_status?: string | null;
    hr_reviewed_by?: string | null;
    hr_reviewed_at?: string | null;
    hr_notes?: string | null;
    profile?: {
      full_name: string;
      cpf?: string | null;
      phone?: string | null;
      credit_limit?: number | null;
      unit?: {
        name: string;
      } | null;
    } | null;
  } | null;
  onSuccess?: () => void;
  currentIndex?: number;
  totalItems?: number;
  onNavigate?: (direction: "prev" | "next") => void;
}

const formatCpf = (cpf: string) => {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const getWhatsAppLink = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  return `https://wa.me/55${cleaned}`;
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  if (diffHours > 0) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  return 'agora mesmo';
};

export function SolicitacaoDetailsSheet({
  open,
  onOpenChange,
  request,
  onSuccess,
  currentIndex = 0,
  totalItems = 1,
  onNavigate,
}: SolicitacaoDetailsSheetProps) {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BenefitStatus>(request?.status || 'aberta');
  const [rejectionReason, setRejectionReason] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState(request?.pdf_url);
  const [approvedValue, setApprovedValue] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("1");
  const [creditInfo, setCreditInfo] = useState<{ limit: number; used: number; available: number } | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType>(request?.benefit_type || 'outros');
  const [isEditingType, setIsEditingType] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<BenefitType | null>(null);
  const [showTypeConfirmDialog, setShowTypeConfirmDialog] = useState(false);
  const [typeChangeHistory, setTypeChangeHistory] = useState<Array<{
    id: string;
    created_at: string;
    old_type: string;
    new_type: string;
    old_type_label: string;
    new_type_label: string;
    user_name?: string;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch credit limit info when request changes
  useEffect(() => {
    const fetchCreditInfo = async () => {
      if (!request?.user_id) return;
      
      setLoadingCredit(true);
      try {
        // Get profile credit limit
        const { data: profileData } = await supabase
          .from('profiles')
          .select('credit_limit')
          .eq('user_id', request.user_id)
          .single();

        const limit = profileData?.credit_limit || 0;

        // Get total used credit (approved requests, excluding current if already approved)
        const { data: usedData } = await supabase
          .from('benefit_requests')
          .select('approved_value')
          .eq('user_id', request.user_id)
          .eq('status', 'aprovada')
          .neq('id', request.id);

        const used = (usedData || []).reduce((sum, r) => sum + (r.approved_value || 0), 0);
        const available = Math.max(0, limit - used);

        setCreditInfo({ limit, used, available });
      } catch (error) {
        console.error('Erro ao buscar limite de crédito:', error);
      } finally {
        setLoadingCredit(false);
      }
    };

    if (open && request) {
      fetchCreditInfo();
    }
  }, [open, request?.user_id, request?.id]);

  // Buscar histórico de alterações de tipo
  useEffect(() => {
    const fetchTypeChangeHistory = async () => {
      if (!request?.id) return;
      
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('logs')
          .select('id, created_at, details, user_id')
          .eq('entity_type', 'benefit_request')
          .eq('entity_id', request.id)
          .eq('action', 'benefit_type_changed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Buscar nomes dos usuários
        const historyWithNames = await Promise.all(
          (data || []).map(async (log) => {
            let userName = 'Sistema';
            if (log.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('user_id', log.user_id)
                .maybeSingle();
              userName = profile?.full_name || 'Usuário';
            }
            
            const details = log.details as Record<string, any> || {};
            return {
              id: log.id,
              created_at: log.created_at,
              old_type: details.old_type || '',
              new_type: details.new_type || '',
              old_type_label: details.old_type_label || '',
              new_type_label: details.new_type_label || '',
              user_name: userName,
            };
          })
        );

        setTypeChangeHistory(historyWithNames);
      } catch (error) {
        console.error('Erro ao buscar histórico de alterações:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (open && request) {
      fetchTypeChangeHistory();
    }
  }, [open, request?.id]);

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setRejectionReason(request.rejection_reason || "");
      setClosingMessage(request.closing_message || "");
      setPdfUrl(request.pdf_url);
      setPdfFile(null);
      setApprovedValue("");
      setTotalInstallments("1");
      setActiveTab("detalhes");
      setSelectedBenefitType(request.benefit_type);
      setIsEditingType(false);
    }
  }, [request?.id, request?.status, request?.rejection_reason, request?.closing_message, request?.pdf_url, request?.benefit_type]);

  // Função para iniciar a confirmação de alteração de tipo
  const handleRequestTypeChange = (newType: BenefitType) => {
    if (newType === request?.benefit_type) {
      setIsEditingType(false);
      return;
    }
    setPendingTypeChange(newType);
    setShowTypeConfirmDialog(true);
  };

  // Função para confirmar e alterar o tipo do protocolo com log
  const handleConfirmTypeChange = async () => {
    if (!pendingTypeChange) return;
    
    setShowTypeConfirmDialog(false);
    setSavingType(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Atualizar o tipo no banco
      const { error: updateError } = await supabase
        .from('benefit_requests')
        .update({ benefit_type: pendingTypeChange })
        .eq('id', request?.id);

      if (updateError) throw updateError;

      // Registrar no log via função do banco
      await supabase.rpc('create_system_log', {
        p_action: 'benefit_type_changed',
        p_entity_type: 'benefit_request',
        p_entity_id: request?.id,
        p_details: {
          protocol: request?.protocol,
          old_type: request?.benefit_type,
          new_type: pendingTypeChange,
          old_type_label: benefitTypeLabels[request?.benefit_type || 'outros'],
          new_type_label: benefitTypeLabels[pendingTypeChange],
        },
        p_user_id: user?.id,
      });

      // Adicionar ao histórico local imediatamente
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      setTypeChangeHistory(prev => [{
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        old_type: request?.benefit_type || '',
        new_type: pendingTypeChange,
        old_type_label: benefitTypeLabels[request?.benefit_type || 'outros'],
        new_type_label: benefitTypeLabels[pendingTypeChange],
        user_name: currentProfile?.full_name || 'Usuário',
      }, ...prev]);

      setSelectedBenefitType(pendingTypeChange);
      setIsEditingType(false);
      toast.success('Tipo alterado com sucesso!', {
        description: `De "${benefitTypeLabels[request?.benefit_type || 'outros']}" para "${benefitTypeLabels[pendingTypeChange]}"`,
      });
      
      // Atualizar a lista
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao alterar tipo:', error);
      toast.error('Erro ao alterar tipo: ' + error.message);
      setSelectedBenefitType(request?.benefit_type || 'outros');
    } finally {
      setSavingType(false);
      setPendingTypeChange(null);
    }
  };

  // Cancelar a alteração de tipo
  const handleCancelTypeChange = () => {
    setShowTypeConfirmDialog(false);
    setPendingTypeChange(null);
  };

  if (!request) return null;

  // Tipos de convênio que exigem valor, parcelas e PDF - usar o tipo atual selecionado
  const convenioTypes: BenefitType[] = ['autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica'];
  const isConvenio = convenioTypes.includes(selectedBenefitType);
  
  // Atestado exige upload de arquivo (PDF ou JPG) mas não valor/parcelas
  const isAtestado = selectedBenefitType === 'atestado';

  const parsedApprovedValue = parseFloat(approvedValue.replace(',', '.')) || 0;
  const parsedInstallments = parseInt(totalInstallments) || 1;
  const installmentValue = parsedInstallments > 0 ? parsedApprovedValue / parsedInstallments : parsedApprovedValue;
  // Validar se o valor TOTAL excede o limite de crédito - apenas para convênios
  const exceedsCredit = isConvenio && creditInfo && creditInfo.limit > 0 && parsedApprovedValue > creditInfo.limit;

  const handleApprove = () => {
    setStatus("aprovada");
    if (isConvenio) {
      toast.success("Status alterado para Aprovado. Faça o upload do PDF.");
    } else if (isAtestado) {
      toast.success("Status alterado para Aprovado. Faça o upload do atestado (PDF ou JPG).");
    } else {
      toast.success("Status alterado para Aprovado.");
    }
  };

  const handleReject = () => {
    setStatus("recusada");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Para atestado, aceitar PDF ou imagens (JPG, JPEG, PNG)
    const allowedTypes = isAtestado 
      ? ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      : ["application/pdf"];
    
    if (!allowedTypes.includes(file.type)) {
      if (isAtestado) {
        toast.error("Por favor, selecione um arquivo PDF ou imagem (JPG, PNG)");
      } else {
        toast.error("Por favor, selecione um arquivo PDF");
      }
      return;
    }

    setPdfFile(file);
    setLoading(true);
    try {
      const fileExtension = file.name.split('.').pop() || 'pdf';
      const fileName = `${request.protocol}_${Date.now()}.${fileExtension}`;
      const { error: uploadError } = await supabase.storage
        .from("benefit-pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("benefit-pdfs")
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);
      toast.success("Arquivo enviado com sucesso");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar arquivo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWebhook = async (
    webhookStatus: "aprovado" | "reprovado",
    motivo?: string,
    mensagemRh?: string
  ) => {
    try {
      const webhookData = {
        protocolo: request.protocol,
        nome_colaborador: request.profile?.full_name || "N/A",
        telefone_whatsapp: request.profile?.phone || "",
        status: webhookStatus,
        motivo: motivo || null,
        account_id: request.account_id || null,
        conversation_id: request.conversation_id || null,
        mensagem_rh: mensagemRh || null,
      };

      console.log("Enviando webhook:", webhookData);

      const response = await fetch(
        "https://n8n.revalle.com.br/webhook/aprovacao",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookData),
        }
      );

      if (!response.ok) {
        console.error("Erro no webhook:", response.status, response.statusText);
      } else {
        console.log("Webhook enviado com sucesso");
      }
    } catch (error) {
      console.error("Erro ao enviar webhook:", error);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // Validações apenas para convênios
      if (status === "aprovada" && isConvenio) {
        if (!pdfUrl) {
          toast.error("É necessário fazer o upload do PDF antes de enviar");
          setLoading(false);
          return;
        }

        if (!approvedValue.trim()) {
          toast.error("É necessário informar o valor aprovado");
          setLoading(false);
          return;
        }

        // Validação do limite - verificar se o valor total cabe no limite de crédito
        if (creditInfo && creditInfo.limit > 0 && parsedApprovedValue > creditInfo.limit) {
          toast.error(
            `O valor total excede o limite de crédito do colaborador`,
            { 
              description: `Valor total: R$ ${parsedApprovedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Limite: R$ ${creditInfo.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          );
          setLoading(false);
          return;
        }
      }

      // Validação para atestado - exige upload de arquivo
      if (status === "aprovada" && isAtestado && !pdfUrl) {
        toast.error("É necessário fazer o upload do atestado antes de enviar");
        setLoading(false);
        return;
      }

      // Obter o usuário atual para registrar quem encerrou
      const { data: { user } } = await supabase.auth.getUser();

      // Atualizar a solicitação no banco de dados
      const updateData: any = {
        status,
        closing_message: closingMessage || null,
        closed_at: new Date().toISOString(),
        closed_by: user?.id || null,
      };

      if (status === "aprovada") {
        updateData.rejection_reason = null;
        // Apenas convênios têm valor, parcelas e PDF
        if (isConvenio) {
          updateData.pdf_url = pdfUrl;
          updateData.approved_value = parsedApprovedValue;
          updateData.total_installments = parsedInstallments;
          updateData.paid_installments = 1; // Primeira parcela já é deduzida na aprovação
        }
        // Atestado tem apenas o arquivo anexado
        if (isAtestado) {
          updateData.pdf_url = pdfUrl;
        }
      } else if (status === "recusada") {
        updateData.rejection_reason = rejectionReason;
        updateData.approved_value = null;
        updateData.total_installments = null;
        updateData.paid_installments = null;
      }

      const { error: updateError } = await supabase
        .from('benefit_requests')
        .update(updateData)
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Se aprovada (convênio), deduzir o valor TOTAL do limite do colaborador
      if (status === "aprovada" && isConvenio && creditInfo && creditInfo.limit > 0) {
        const newLimit = Math.max(0, creditInfo.limit - parsedApprovedValue);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ credit_limit: newLimit })
          .eq('user_id', request.user_id);
        
        if (profileError) {
          console.error('Erro ao atualizar limite de crédito:', profileError);
          // Não falhar a operação, apenas logar
        }
      }

      // Enviar webhook após atualização bem-sucedida
      await sendWebhook(
        status === "aprovada" ? "aprovado" : "reprovado",
        status === "recusada" ? rejectionReason : undefined,
        closingMessage
      );

      toast.success("Solicitação atualizada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao processar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPending = request.status === "aberta" || request.status === "em_analise";
  const isApproved = status === "aprovada";
  const isRejected = status === "recusada";
  const isClosed = request.status === "aprovada" || request.status === "recusada";

  // HR approval logic for "alteracao_ferias"
  const isAlteracaoFerias = selectedBenefitType === 'alteracao_ferias';
  const isRhUser = userRole === 'rh';
  const isDpOrGestor = userRole === 'admin' || userRole === 'gestor' || userRole === 'agente_dp';
  const hrNeedsApproval = isAlteracaoFerias && (!request.hr_status || request.hr_status === 'pendente');
  const hrApproved = request.hr_status === 'aprovada';
  
  // DP/Gestor can only act on alteracao_ferias if HR has approved
  const canDpActOnRequest = !isAlteracaoFerias || hrApproved;

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < totalItems - 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header fixo */}
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Detalhes do Protocolo</SheetTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {request.protocol}
              </p>
            </div>

            {/* Navegação */}
            {onNavigate && totalItems > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onNavigate("prev")}
                  disabled={!canNavigatePrev || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[50px] text-center">
                  {currentIndex + 1} / {totalItems}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onNavigate("next")}
                  disabled={!canNavigateNext || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
            <TabsTrigger value="detalhes" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Detalhes Tab */}
          <TabsContent value="detalhes" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Status atual */}
                <div className="flex items-center justify-between">
                  <StatusBadge status={status} />
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(request.created_at)}
                  </span>
                </div>

                {/* Informações do colaborador */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Colaborador</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{request.profile?.full_name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {request.profile?.cpf ? formatCpf(request.profile.cpf) : "CPF não informado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.profile?.unit?.name || "Unidade não informada"}</span>
                    </div>
                    {request.profile?.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.profile.phone}</span>
                        </div>
                        <a
                          href={getWhatsAppLink(request.profile.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          Abrir WhatsApp
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Detalhes do convênio */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Solicitação</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                      {isEditingType ? (
                        <div className="flex gap-2">
                          <Select
                            value={selectedBenefitType}
                            onValueChange={(value) => handleRequestTypeChange(value as BenefitType)}
                            disabled={savingType}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {Object.entries(benefitTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingType(false);
                              setSelectedBenefitType(request.benefit_type);
                            }}
                            disabled={savingType}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {benefitTypeLabels[selectedBenefitType]}
                          </p>
                          {!isClosed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setIsEditingType(true)}
                              title="Alterar tipo"
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Histórico de alterações de tipo */}
                      {typeChangeHistory.length > 0 && (
                        <div className="col-span-2 mt-2">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <History className="h-3 w-3" />
                            Histórico de Alterações
                          </p>
                          <div className="space-y-2">
                            {typeChangeHistory.map((change) => (
                              <div 
                                key={change.id} 
                                className="text-xs bg-muted/50 rounded p-2 border-l-2 border-primary/30"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-muted-foreground">
                                    {format(new Date(change.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                  <span className="text-muted-foreground font-medium">
                                    {change.user_name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="line-through text-muted-foreground">
                                    {change.old_type_label}
                                  </span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium text-foreground">
                                    {change.new_type_label}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Abertura</p>
                      <p className="font-medium">
                        {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {/* Tempo de conclusão para chamados finalizados */}
                    {isClosed && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Tempo até conclusão</p>
                        <p className="font-medium">
                          {(() => {
                            const endDate = request.closed_at ? new Date(request.closed_at) : new Date();
                            const startDate = new Date(request.created_at);
                            const diffMs = endDate.getTime() - startDate.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffDays = Math.floor(diffHours / 24);
                            const remainingHours = diffHours % 24;
                            
                            if (diffDays > 0) {
                              return `${diffDays}d ${remainingHours}h`;
                            }
                            return `${diffHours}h`;
                          })()}
                        </p>
                      </div>
                    )}
                    {request.reviewer_name && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Responsável pela Análise</p>
                        <p className="font-medium text-primary">{request.reviewer_name}</p>
                        {request.reviewed_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            desde {format(new Date(request.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {request.details && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                      <p className="text-sm bg-muted/50 rounded p-3">{request.details}</p>
                    </div>
                  )}
                </div>

                {/* Informações de fechamento (se já encerrado) */}
                {isClosed && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Encerramento</h4>
                      
                      {/* Valor Aprovado e Parcelas */}
                      {request.status === 'aprovada' && request.approved_value && (
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Valor Aprovado</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              R$ {request.approved_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {request.total_installments && request.total_installments > 1 && (
                            <>
                              <Separator className="bg-emerald-500/20" />
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Parcelas</span>
                                <span className="font-semibold">
                                  {request.paid_installments || 0} / {request.total_installments}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Valor por Parcela</span>
                                <span className="font-medium">
                                  R$ {(request.approved_value / request.total_installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {request.closing_message && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                          <p className="text-sm bg-muted/50 rounded p-3">{request.closing_message}</p>
                        </div>
                      )}
                      {request.rejection_reason && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Motivo da rejeição</p>
                          <p className="text-sm bg-destructive/10 text-destructive rounded p-3">
                            {request.rejection_reason}
                          </p>
                        </div>
                      )}
                      {request.pdf_url && (
                        <a
                          href={request.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FileUp className="h-4 w-4" />
                          Ver PDF anexado
                        </a>
                      )}
                    </div>
                  </>
                )}

                {/* HR Approval Section for alteracao_ferias - always show for history, allow actions only when pending */}
                {isAlteracaoFerias && (
                  <HrApprovalSection
                    requestId={request.id}
                    hrStatus={request.hr_status || null}
                    hrReviewedBy={request.hr_reviewed_by || null}
                    hrReviewedAt={request.hr_reviewed_at || null}
                    hrNotes={request.hr_notes || null}
                    userRole={userRole}
                    isPending={isPending && !isClosed}
                    onSuccess={onSuccess}
                  />
                )}

                {/* Ações (se pendente) - Para RH, só mostra na seção de RH */}
                {isPending && !isClosed && !isRhUser && canDpActOnRequest && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-muted-foreground">Ações</h4>

                      {/* Botões de ação */}
                      <div className="flex gap-3">
                        <Button
                          onClick={handleApprove}
                          className="flex-1"
                          variant={isApproved ? "default" : "outline"}
                          disabled={loading}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={handleReject}
                          className="flex-1"
                          variant={isRejected ? "destructive" : "outline"}
                          disabled={loading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reprovar
                        </Button>
                      </div>

                      {/* Campo de rejeição */}
                      {isRejected && (
                        <div className="space-y-2">
                          <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                          <Textarea
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Descreva o motivo da rejeição..."
                            rows={3}
                          />
                        </div>
                      )}

                      {/* Campos de valor aprovado e parcelas - apenas para convênios */}
                      {isApproved && isConvenio && (
                        <div className="space-y-4">
                          {/* Informação do Limite de Crédito */}
                          {creditInfo && creditInfo.limit > 0 && (
                            <div className={cn(
                              "rounded-lg p-3 space-y-2",
                              exceedsCredit 
                                ? "bg-destructive/10 border border-destructive/30" 
                                : "bg-muted/50 border border-border"
                            )}>
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Limite de Crédito</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground block">Total</span>
                                  <span className="font-medium">
                                    R$ {creditInfo.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Utilizado</span>
                                  <span className="font-medium text-amber-600 dark:text-amber-400">
                                    R$ {creditInfo.used.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Disponível</span>
                                  <span className={cn(
                                    "font-bold",
                                    exceedsCredit ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                                  )}>
                                    R$ {creditInfo.available.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              {exceedsCredit && (
                                <div className="flex items-center gap-2 text-xs text-destructive mt-2">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>O valor da parcela (R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) excede o limite!</span>
                                </div>
                              )}
                            </div>
                          )}

                          {loadingCredit && (
                            <div className="text-xs text-muted-foreground">
                              Carregando informações de crédito...
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="approved-value">Valor Aprovado (R$) *</Label>
                              <Input
                                id="approved-value"
                                type="text"
                                value={approvedValue}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d,\.]/g, '');
                                  setApprovedValue(value);
                                }}
                                placeholder="0,00"
                                className={exceedsCredit ? "border-destructive" : ""}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="installments">Nº de Parcelas</Label>
                              <Input
                                id="installments"
                                type="number"
                                min="1"
                                max="60"
                                value={totalInstallments}
                                onChange={(e) => setTotalInstallments(e.target.value)}
                                placeholder="1"
                              />
                            </div>
                          </div>

                          {parseInt(totalInstallments) > 1 && approvedValue && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Valor por parcela:</span>
                                <span className="font-medium">
                                  R$ {(parsedApprovedValue / parseInt(totalInstallments)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Upload de PDF (aprovado) - apenas para convênios */}
                      {isApproved && isConvenio && (
                        <div className="space-y-2">
                          <Label>Upload de PDF *</Label>
                          <Button
                            onClick={() => document.getElementById("pdf-upload")?.click()}
                            variant="outline"
                            disabled={loading}
                            className="w-full"
                          >
                            <FileUp className="w-4 h-4 mr-2" />
                            {pdfFile ? pdfFile.name : pdfUrl ? "Substituir PDF" : "Selecionar PDF"}
                          </Button>
                          <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          {pdfUrl && (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver PDF atual
                            </a>
                          )}
                        </div>
                      )}

                      {/* Upload de arquivo para Atestado (PDF ou JPG) */}
                      {isApproved && isAtestado && (
                        <div className="space-y-2">
                          <Label>Upload do Atestado (PDF ou JPG) *</Label>
                          <Button
                            onClick={() => document.getElementById("atestado-upload")?.click()}
                            variant="outline"
                            disabled={loading}
                            className="w-full"
                          >
                            <FileUp className="w-4 h-4 mr-2" />
                            {pdfFile ? pdfFile.name : pdfUrl ? "Substituir arquivo" : "Selecionar arquivo"}
                          </Button>
                          <input
                            id="atestado-upload"
                            type="file"
                            accept="application/pdf,image/jpeg,image/jpg,image/png"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          {pdfUrl && (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Ver arquivo atual
                            </a>
                          )}
                        </div>
                      )}

                      {/* Mensagem ao colaborador */}
                      {(isApproved || isRejected) && (
                        <div className="space-y-2">
                          <Label htmlFor="closing-message">Mensagem ao Colaborador *</Label>
                          <Textarea
                            id="closing-message"
                            value={closingMessage}
                            onChange={(e) => setClosingMessage(e.target.value)}
                            placeholder={
                              isApproved
                                ? "Seu convênio foi aprovado..."
                                : "Sua solicitação foi analisada..."
                            }
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
            <ChatPanel
              requestId={request.id}
              userName={request.profile?.full_name}
              userPhone={request.profile?.phone || undefined}
              whatsappJid={request.whatsapp_jid}
            />
          </TabsContent>
        </Tabs>

        {/* Footer fixo com botão de enviar */}
        {(isApproved || isRejected) && !isClosed && activeTab === "detalhes" && (
          <div className="p-6 pt-4 border-t border-border">
            <Button
              onClick={handleSend}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Enviando..." : "Enviar e Encerrar"}
            </Button>
          </div>
        )}
      </SheetContent>

      {/* Dialog de confirmação para alteração de tipo */}
      <ConfirmDialog
        open={showTypeConfirmDialog}
        onOpenChange={setShowTypeConfirmDialog}
        title="Confirmar alteração de tipo"
        description={`Deseja realmente alterar o tipo do protocolo de "${benefitTypeLabels[request?.benefit_type || 'outros']}" para "${pendingTypeChange ? benefitTypeLabels[pendingTypeChange] : ''}"? Esta ação será registrada no histórico.`}
        confirmLabel="Alterar tipo"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmTypeChange}
      />
    </Sheet>
  );
}
