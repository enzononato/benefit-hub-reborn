# Regra: 1 chamado em aberto por colaborador

Bloqueia novas solicitações (qualquer tipo) quando o colaborador já tem um protocolo com status `aberta` ou `em_analise`. Valida no Bot (WhatsApp) e no Painel.

## 1. Banco — `create_request_from_bot`

Adicionar bloco de validação antes da criação do protocolo, retornando o mesmo formato JSON dos outros bloqueios:

```json
{
  "success": false,
  "error": "duplicate_open_request",
  "message": "Você já possui uma solicitação em aberto (protocolo XYZ). Aguarde o atendimento antes de abrir outra.",
  "existing_protocol": "REVALLE-..."
}
```

Lógica: `SELECT protocol FROM benefit_requests WHERE user_id = v_user_id AND status IN ('aberta','em_analise') LIMIT 1`. Se existir → retorna o erro acima.

## 2. Painel — Nova Solicitação manual

Em `NewBenefitDialog.tsx`: ao selecionar colaborador, consultar se já existe protocolo `aberta`/`em_analise` e, em caso afirmativo, desabilitar o botão "Criar" exibindo aviso com o protocolo existente (link clicável que abre o sheet do protocolo).

## 3. Relatório de duplicados existentes

Gerar CSV em `/mnt/documents/colaboradores_chamados_duplicados.csv` listando: nome, CPF, qtd em aberto, protocolos. Já identifiquei 8 colaboradores hoje (1 com 5 abertos, 7 com 2 abertos). Você revisa manualmente e fecha os duplicados pelo painel — a regra não toca em dados existentes.

## 4. Memória

Atualizar `mem://infrastructure/database-functions/bot-request-validation-logic` adicionando `duplicate_open_request` à lista de erros que o n8n deve mapear.

## Detalhes técnicos

- **Migration:** `CREATE OR REPLACE FUNCTION public.create_request_from_bot(...)` com o novo bloco posicionado depois das validações de status (`limite_excedido`, `ferias`, etc.) e antes do mapeamento de `benefit_type`.
- **Frontend:** hook ou query pontual em `NewBenefitDialog` (`supabase.from('benefit_requests').select('protocol').eq('user_id', x).in('status', ['aberta','em_analise']).maybeSingle()`).
- **Sem mudança de schema** (não adiciona coluna nem índice — `user_id` já está indexado implicitamente via uso).
- **Status `alteracao_ferias` pendente HR** não conta como bloqueio (conforme escolha de só usar `aberta`/`em_analise`).
