import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRequestMessages } from '@/hooks/useRequestMessages';
import { useAuth } from '@/contexts/AuthContext';

interface ChatPanelProps {
  requestId: string;
  userName?: string;
  userPhone?: string;
  accountId?: number | null;
  conversationId?: number | null;
}

export function ChatPanel({
  requestId,
  userName,
  userPhone,
  accountId,
  conversationId,
}: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sendViaWhatsapp, setSendViaWhatsapp] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const { messages, loading, sending, sendMessage } = useRequestMessages(requestId);

  // Auto scroll to last message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const success = await sendMessage(newMessage, sendViaWhatsapp, {
      accountId,
      conversationId,
      userName,
      userPhone,
    });

    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSendWhatsapp = Boolean(accountId && conversationId);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea className="flex-1 px-1">
        <div className="space-y-3 py-4">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              <p className="text-xs">Inicie a conversa enviando uma mensagem</p>
            </div>
          ) : (
            messages.map((message) => {
              const isFromCurrentUser = message.sender_id === user?.id;
              const isFromWhatsapp = message.sent_via === 'whatsapp';
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex flex-col max-w-[85%]',
                    isFromCurrentUser ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  {/* Sender name */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {message.sender_name || (isFromCurrentUser ? 'Você' : 'Colaborador')}
                    </span>
                    {isFromWhatsapp && (
                      <Badge variant="outline" className="h-4 text-[10px] px-1.5 bg-green-500/10 text-green-600 border-green-500/30">
                        WhatsApp
                      </Badge>
                    )}
                  </div>
                  
                  {/* Message bubble */}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      isFromCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(message.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border p-4 space-y-3 bg-background">
        {/* WhatsApp checkbox */}
        {canSendWhatsapp && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="send-whatsapp"
              checked={sendViaWhatsapp}
              onCheckedChange={(checked) => setSendViaWhatsapp(checked === true)}
            />
            <Label
              htmlFor="send-whatsapp"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Enviar também via WhatsApp
            </Label>
          </div>
        )}

        {/* Message input */}
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
            disabled={sending}
            className="min-h-[60px] max-h-[120px] resize-none"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="h-auto px-4"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {!canSendWhatsapp && (
          <p className="text-[10px] text-muted-foreground">
            * Envio via WhatsApp não disponível (protocolo sem dados de conversa)
          </p>
        )}
      </div>
    </div>
  );
}
