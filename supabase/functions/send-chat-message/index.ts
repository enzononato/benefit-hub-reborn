import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      benefit_request_id, 
      sender_id, 
      sender_name, 
      message, 
      send_via_whatsapp,
      // New: whatsapp_jid (Evolution API direct integration)
      whatsapp_jid,
      // Legacy: Chatwoot integration (for backward compatibility)
      account_id,
      conversation_id,
      user_name,
      user_phone
    } = await req.json();

    if (!benefit_request_id || !sender_id || !message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: benefit_request_id, sender_id, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch protocol for the webhook
    const { data: requestData } = await supabase
      .from("benefit_requests")
      .select("protocol")
      .eq("id", benefit_request_id)
      .single();

    // Insert message into database
    const { data: insertedMessage, error: insertError } = await supabase
      .from("request_messages")
      .insert({
        benefit_request_id,
        sender_id,
        sender_name: sender_name || "Administrador",
        message: message.trim(),
        sent_via: "sistema",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao inserir mensagem:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar mensagem", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If send_via_whatsapp is enabled, call the n8n webhook
    let whatsappSent = false;
    
    // Priority: whatsapp_jid (Evolution API) > account_id + conversation_id (Chatwoot legacy)
    if (send_via_whatsapp && (whatsapp_jid || (account_id && conversation_id))) {
      try {
        const webhookPayload: Record<string, unknown> = {
          message: message.trim(),
          sender_name: sender_name || "Administrador",
          user_name,
          user_phone,
          protocol: requestData?.protocol,
        };

        // Add whatsapp_jid for Evolution API direct integration
        if (whatsapp_jid) {
          webhookPayload.whatsapp_jid = whatsapp_jid;
        }

        // Add legacy Chatwoot fields for backward compatibility
        if (account_id && conversation_id) {
          webhookPayload.account_id = account_id;
          webhookPayload.conversation_id = conversation_id;
        }

        const webhookResponse = await fetch("https://n8n.revalle.com.br/webhook/chat-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        if (webhookResponse.ok) {
          whatsappSent = true;
          console.log("Mensagem enviada via WhatsApp com sucesso");
        } else {
          console.error("Erro ao enviar via WhatsApp:", webhookResponse.status, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error("Erro no webhook WhatsApp:", webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: insertedMessage,
        whatsapp_sent: whatsappSent
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na edge function:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
