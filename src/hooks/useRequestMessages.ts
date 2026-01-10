import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface RequestMessage {
  id: string;
  benefit_request_id: string;
  sender_id: string;
  sender_name: string | null;
  message: string;
  sent_via: 'sistema' | 'whatsapp' | null;
  created_at: string;
}

export function useRequestMessages(requestId: string | null) {
  const [messages, setMessages] = useState<RequestMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user, userName } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!requestId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('request_messages')
        .select('*')
        .eq('benefit_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Fetch messages on mount and set up polling
  useEffect(() => {
    if (!requestId) return;
    
    fetchMessages();
    
    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [requestId, fetchMessages]);

  const sendMessage = async (
    message: string,
    sendViaWhatsapp: boolean = false,
    webhookData?: {
      accountId?: number | null;
      conversationId?: number | null;
      userName?: string;
      userPhone?: string;
    }
  ) => {
    if (!requestId || !user || !message.trim()) return false;

    setSending(true);
    try {
      // Insert message into database
      const { error: insertError } = await supabase
        .from('request_messages')
        .insert({
          benefit_request_id: requestId,
          sender_id: user.id,
          sender_name: userName || 'Administrador',
          message: message.trim(),
          sent_via: 'sistema',
        });

      if (insertError) throw insertError;

      // If sendViaWhatsapp is enabled, call the n8n webhook
      if (sendViaWhatsapp && webhookData?.accountId && webhookData?.conversationId) {
        try {
          const response = await fetch('https://n8n.revalle.com.br/webhook/chat-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: message.trim(),
              account_id: webhookData.accountId,
              conversation_id: webhookData.conversationId,
              sender_name: userName || 'Administrador',
              user_name: webhookData.userName,
              user_phone: webhookData.userPhone,
            }),
          });

          if (!response.ok) {
            console.error('Erro ao enviar via WhatsApp:', response.status);
            toast({
              title: 'Aviso',
              description: 'Mensagem salva, mas houve erro ao enviar via WhatsApp.',
              variant: 'destructive',
            });
          }
        } catch (webhookError) {
          console.error('Erro no webhook WhatsApp:', webhookError);
        }
      }

      // Refresh messages
      await fetchMessages();
      
      toast({
        title: 'Mensagem enviada',
        description: sendViaWhatsapp ? 'Mensagem enviada e encaminhada via WhatsApp.' : 'Mensagem enviada com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchMessages,
  };
}
