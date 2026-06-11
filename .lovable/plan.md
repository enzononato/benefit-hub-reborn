## Objetivo

Eliminar duplicidade de protocolos em requisições simultâneas do bot serializando por `p_conversation_id` via advisory lock transacional.

## Mudança

Atualizar a função `public.create_request_from_bot` adicionando, como **primeira instrução após o `BEGIN`**, um advisory lock transacional escopado pela conversa.

### Detalhes técnicos

- `p_conversation_id` é `bigint`, então usaremos `hashtext(p_conversation_id::text)` para gerar o chave de lock (retorna `int4`, aceito por `pg_advisory_xact_lock`).
- Envolver em guarda `IF p_conversation_id IS NOT NULL THEN ... END IF;` para não travar globalmente quando a conversa não for informada (chamadas manuais/testes).
- O lock é **transacional** (`_xact_`): liberado automaticamente no COMMIT/ROLLBACK, sem necessidade de unlock manual.
- Nenhuma outra lógica da função é alterada — o `SELECT` de idempotência por `conversation_id` (janela de 3 minutos) já existente passa a ver o protocolo recém-commitado pela primeira requisição e retorna `idempotent_replay: true` para a segunda.

### SQL da migration

```sql
CREATE OR REPLACE FUNCTION public.create_request_from_bot(
  p_cpf text,
  p_protocol text DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_benefit_text text DEFAULT 'outros',
  p_whatsapp_jid text DEFAULT NULL,
  p_account_id bigint DEFAULT NULL,
  p_conversation_id bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  -- (mesmas variáveis da versão atual)
BEGIN
  -- Serialize concurrent bot requests per conversation to prevent race conditions
  IF p_conversation_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_conversation_id::text));
  END IF;

  -- ... restante do corpo atual permanece idêntico ...
END;
$function$;
```

## Resultado esperado

Duas mensagens simultâneas da mesma conversa: a segunda fica em espera até o COMMIT da primeira, então o bloco de idempotência detecta o protocolo recém-criado e devolve o mesmo `protocol` com `idempotent_replay: true`, sem inserir novo registro.