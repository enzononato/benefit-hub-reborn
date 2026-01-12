import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessResult {
  requestId: string;
  userId: string;
  protocol: string;
  installmentValue: number;
  previousLimit: number;
  newLimit: number;
  paidInstallments: number;
  totalInstallments: number;
  status: "success" | "error" | "completed";
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Iniciando processamento de parcelas mensais...");

    // Buscar todas as solicitações aprovadas com parcelas pendentes
    const { data: pendingRequests, error: fetchError } = await supabase
      .from("benefit_requests")
      .select(`
        id,
        user_id,
        protocol,
        approved_value,
        total_installments,
        paid_installments,
        benefit_type
      `)
      .eq("status", "aprovada")
      .not("approved_value", "is", null)
      .filter("paid_installments", "lt", supabase.rpc("get_total_installments_ref"));
    
    // Consulta alternativa já que o filtro acima pode não funcionar diretamente
    const { data: allApprovedRequests, error: allFetchError } = await supabase
      .from("benefit_requests")
      .select(`
        id,
        user_id,
        protocol,
        approved_value,
        total_installments,
        paid_installments,
        benefit_type
      `)
      .eq("status", "aprovada")
      .not("approved_value", "is", null);

    if (allFetchError) {
      console.error("Erro ao buscar solicitações:", allFetchError);
      throw allFetchError;
    }

    // Filtrar apenas as que ainda têm parcelas pendentes
    const requestsWithPendingInstallments = (allApprovedRequests || []).filter(
      (req) => (req.paid_installments || 0) < (req.total_installments || 1)
    );

    console.log(`Encontradas ${requestsWithPendingInstallments.length} solicitações com parcelas pendentes`);

    const results: ProcessResult[] = [];

    for (const request of requestsWithPendingInstallments) {
      const totalInstallments = request.total_installments || 1;
      const paidInstallments = request.paid_installments || 0;
      const approvedValue = request.approved_value || 0;
      const installmentValue = approvedValue / totalInstallments;

      // Buscar o limite atual do colaborador
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("credit_limit, full_name")
        .eq("user_id", request.user_id)
        .single();

      if (profileError || !profile) {
        console.error(`Erro ao buscar perfil do usuário ${request.user_id}:`, profileError);
        results.push({
          requestId: request.id,
          userId: request.user_id,
          protocol: request.protocol,
          installmentValue,
          previousLimit: 0,
          newLimit: 0,
          paidInstallments: paidInstallments,
          totalInstallments: totalInstallments,
          status: "error",
          message: `Perfil não encontrado: ${profileError?.message || "Usuário não existe"}`
        });
        continue;
      }

      const currentLimit = profile.credit_limit || 0;
      const newPaidInstallments = paidInstallments + 1;
      const isLastInstallment = newPaidInstallments >= totalInstallments;

      // CRÉDITO ROTATIVO:
      // 1. Primeiro restaura a parcela anterior (colaborador pagou via folha)
      // 2. Se não é a última parcela, deduz a próxima
      // 3. Se é a última, apenas restaura (não há mais parcelas a cobrar)
      
      const restoredLimit = currentLimit + installmentValue;
      const newLimit = isLastInstallment 
        ? restoredLimit  // Última parcela: apenas restaura
        : restoredLimit - installmentValue;  // Ainda há parcelas: restaura e deduz próxima

      // Atualizar o limite de crédito do colaborador
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          credit_limit: newLimit,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", request.user_id);

      if (updateProfileError) {
        console.error(`Erro ao atualizar limite do usuário ${request.user_id}:`, updateProfileError);
        results.push({
          requestId: request.id,
          userId: request.user_id,
          protocol: request.protocol,
          installmentValue,
          previousLimit: currentLimit,
          newLimit: currentLimit,
          paidInstallments: paidInstallments,
          totalInstallments: totalInstallments,
          status: "error",
          message: `Erro ao atualizar limite: ${updateProfileError.message}`
        });
        continue;
      }

      // Atualizar o número de parcelas pagas
      const { error: updateRequestError } = await supabase
        .from("benefit_requests")
        .update({
          paid_installments: newPaidInstallments,
          updated_at: new Date().toISOString()
        })
        .eq("id", request.id);

      if (updateRequestError) {
        console.error(`Erro ao atualizar parcelas da solicitação ${request.id}:`, updateRequestError);
        // Reverter a atualização do limite
        await supabase
          .from("profiles")
          .update({
            credit_limit: currentLimit,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", request.user_id);

        results.push({
          requestId: request.id,
          userId: request.user_id,
          protocol: request.protocol,
          installmentValue,
          previousLimit: currentLimit,
          newLimit: currentLimit,
          paidInstallments: paidInstallments,
          totalInstallments: totalInstallments,
          status: "error",
          message: `Erro ao atualizar parcelas: ${updateRequestError.message}`
        });
        continue;
      }

      const isCompleted = isLastInstallment;
      const limitChangeDescription = isLastInstallment 
        ? `+R$ ${installmentValue.toFixed(2)} (última parcela paga)`
        : `R$ ${currentLimit.toFixed(2)} -> R$ ${newLimit.toFixed(2)} (parcela paga e próxima cobrada)`;

      console.log(
        `[${request.protocol}] Parcela ${newPaidInstallments}/${totalInstallments} processada. ` +
        `Limite: ${limitChangeDescription}`
      );

      results.push({
        requestId: request.id,
        userId: request.user_id,
        protocol: request.protocol,
        installmentValue,
        previousLimit: currentLimit,
        newLimit,
        paidInstallments: newPaidInstallments,
        totalInstallments: totalInstallments,
        status: isCompleted ? "completed" : "success",
        message: isCompleted 
          ? "Todas as parcelas foram pagas" 
          : `Parcela ${newPaidInstallments}/${totalInstallments} processada`
      });
    }

    // Registrar log de auditoria
    const summary = {
      total_processed: results.length,
      successful: results.filter(r => r.status === "success" || r.status === "completed").length,
      completed: results.filter(r => r.status === "completed").length,
      errors: results.filter(r => r.status === "error").length,
      total_restored: results
        .filter(r => r.status === "completed")
        .reduce((sum, r) => sum + r.installmentValue, 0),
      total_rotated: results
        .filter(r => r.status === "success")
        .reduce((sum, r) => sum + r.installmentValue, 0)
    };

    console.log("Resumo do processamento:", summary);

    // Criar log no sistema
    await supabase.rpc("create_system_log", {
      p_action: "MONTHLY_INSTALLMENTS_PROCESSED",
      p_entity_type: "benefit_requests",
      p_details: {
        summary,
        processed_at: new Date().toISOString(),
        results: results.map(r => ({
          protocol: r.protocol,
          status: r.status,
          installmentValue: r.installmentValue,
          paidInstallments: r.paidInstallments,
          totalInstallments: r.totalInstallments
        }))
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processamento concluído. ${summary.successful} parcelas processadas, ${summary.errors} erros.`,
        summary,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no processamento de parcelas:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
