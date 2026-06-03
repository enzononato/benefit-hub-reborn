# Registrar tentativas rejeitadas do bot na auditoria

Hoje, quando o `create_request_from_bot` rejeita uma tentativa (CPF não encontrado, limite excedido, duplicado em aberto, demitido, afastado, férias, tempo de admissão insuficiente, data de admissão ausente, protocolo duplicado), o retorno volta para o n8n mas **nada é gravado** — por isso "abriram pelo bot e não virou chamado" some sem rastro.

## Mudança

Atualizar a função `public.create_request_from_bot` para chamar `create_system_log` **antes de cada `RETURN` de erro**, registrando a tentativa com:

- `action`: `bot_request_rejected`
- `entity_type`: `benefit_request_attempt`
- `entity_id`: `NULL` (não há request criado) ou o `user_id` do colaborador quando encontrado
- `user_id`: o `user_id` do colaborador (quando o CPF bate) — `NULL` em `user_not_found`
- `details` (jsonb):
  - `reason`: o mesmo código de erro já retornado (`user_not_found`, `user_inactive`, `user_on_leave`, `user_on_vacation`, `user_limit_exceeded`, `duplicate_open_request`, `missing_admission_date`, `insufficient_admission_time`, `duplicate_protocol`)
  - `message`: a mensagem em português já existente
  - `cpf`: o CPF enviado (mascarado parcialmente, ex.: `***.123.456-**`)
  - `benefit_text`: o `p_benefit_text` recebido
  - `benefit_type`: o tipo resolvido (quando aplicável)
  - `conversation_id`, `account_id`, `whatsapp_jid` quando presentes
  - Para `insufficient_admission_time`: `required_days`, `current_days`
  - Para `duplicate_open_request`: `existing_protocol`
  - Para `duplicate_protocol`: o `protocol` recebido

Pontos importantes:

- A idempotência por `conversation_id` (curto-circuito já existente) **não gera log de rejeição** — é replay de sucesso.
- O retorno JSON para o n8n permanece **idêntico** (mesmas chaves), garantindo que a automação não quebre.
- O `details` da tela de Auditoria já mostra `Tipo de Entidade` e `Detalhes da Ação` em formato chave/valor — basta adicionar os labels `bot_request_rejected` e `benefit_request_attempt` no front (`Auditoria.tsx`) e em `AuditLogSheet.tsx`/`AuditStats.tsx` para exibir "Tentativa de bot rejeitada" e "Tentativa de Solicitação".

## Após aplicar

- Filtrar por ação `bot_request_rejected` na página de Auditoria mostra todas as tentativas perdidas com motivo e CPF.
- Atualizar `mem://infrastructure/database-functions/bot-request-validation-logic` documentando o novo log de rejeição.

## Mascaramento de CPF

Para não vazar CPF cru no log, vou aplicar regex que preserva apenas os dígitos centrais: ex. `12345678900` → `***.456.789-**`. Se preferir CPF completo (auditoria fiscal/RH), me avisa antes de eu aplicar.
