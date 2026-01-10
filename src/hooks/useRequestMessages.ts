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

  const fetchMessages = useCallback(async (isInitialLoad = false) => {
    if (!requestId) return;
    
    if (isInitialLoad) setLoading(true);
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
      if (isInitialLoad) setLoading(false);
    }
  }, [requestId]);

  // Fetch messages on mount and set up polling
  useEffect(() => {
    if (!requestId) return;
    
    fetchMessages(true); // Initial load with loading state
    
    // Poll every 5 seconds for new messages (without loading indicator)
    const interval = setInterval(() => fetchMessages(false), 5000);
    
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
      // Call edge function to send message (handles both DB insert and WhatsApp webhook)
      const { data, error } = await supabase.functions.invoke('send-chat-message', {
        body: {
          benefit_request_id: requestId,
          sender_id: user.id,
          sender_name: userName || 'Administrador',
          message: message.trim(),
          send_via_whatsapp: sendViaWhatsapp,
          account_id: webhookData?.accountId,
          conversation_id: webhookData?.conversationId,
          user_name: webhookData?.userName,
          user_phone: webhookData?.userPhone,
        },
      });

      if (error) throw error;

      // Refresh messages
      await fetchMessages(false);
      
      const whatsappSent = data?.whatsapp_sent;
      toast({
        title: 'Mensagem enviada',
        description: whatsappSent 
          ? 'Mensagem enviada e encaminhada via WhatsApp.' 
          : 'Mensagem enviada com sucesso.',
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
