# Idempotência no `create_request_from_bot`

Evita duplicidade de chamados quando o n8n reexecuta o nó após instabilidade da IA. Se o mesmo `p_conversation_id` chegar mais de uma vez, retornamos sucesso com o protocolo já gravado — sem disparar `duplicate_open_request` nem qualquer outra validação.

## Mudança

Migration `CREATE OR REPLACE FUNCTION public.create_request_from_bot(...)` adicionando, **logo após a busca do `profiles` por CPF** (e antes de qualquer validação de status/limite/admissão/duplicidade), um curto-circuito:

```sql
IF p_conversation_id IS NOT NULL THEN
  SELECT br.protocol, br.id, br.benefit_type
    INTO v_final_protocol, v_request_id, v_benefit_type
  FROM benefit_requests br
  WHERE br.conversation_id = p_conversation_id
  ORDER BY br.created_at DESC
  LIMIT 1;

  IF v_final_protocol IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'request_id', v_request_id,
      'protocol', v_final_protocol,
      'benefit_type', v_benefit_type,
      'user_name', v_full_name,
      'idempotent_replay', true
    );
  END IF;
END IF;
```

- Retorno **idêntico** ao sucesso normal (mesmas chaves), com flag extra `idempotent_replay: true` apenas para observabilidade — o n8n pode ignorar.
- Sem mudança de schema. `benefit_requests.conversation_id` já é populado na inserção atual.
- Painel não é afetado (não envia `conversation_id`).
- Demais validações (`user_limit_exceeded`, `duplicate_open_request`, admissão, status etc.) só executam quando NÃO for replay.

## Memória

Atualizar `mem://infrastructure/database-functions/bot-request-validation-logic` documentando o curto-circuito de idempotência por `conversation_id`.
