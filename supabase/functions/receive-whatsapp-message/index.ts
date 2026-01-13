import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { protocol, sender_name, message, account_id, conversation_id } = await req.json();

    // Validação
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório: message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!protocol && !(account_id && conversation_id)) {
      return new Response(
        JSON.stringify({ error: "Informe protocol OU (account_id + conversation_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar benefit_request
    let query = supabase.from("benefit_requests").select("id, user_id, protocol");
    
    if (protocol) {
      query = query.eq("protocol", protocol);
    } else {
      query = query.eq("account_id", account_id).eq("conversation_id", conversation_id);
    }

    const { data: request, error: requestError } = await query.single();

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: "Solicitação não encontrada", details: requestError?.message }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inserir mensagem
    const { data: insertedMessage, error: insertError } = await supabase
      .from("request_messages")
      .insert({
        benefit_request_id: request.id,
        sender_id: request.user_id,
        sender_name: sender_name || "Colaborador",
        message: message.trim(),
        sent_via: "whatsapp",
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Erro ao salvar mensagem", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Mensagem recebida do WhatsApp para protocolo ${request.protocol}`);

    return new Response(
      JSON.stringify({ success: true, message: insertedMessage, protocol: request.protocol }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao processar mensagem do WhatsApp:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
