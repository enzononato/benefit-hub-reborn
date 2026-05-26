## Objetivo

Criar uma nova situação para o colaborador, no mesmo modelo de `ferias` e `afastado`, indicando que ele estourou o limite e não pode abrir solicitações até o próximo mês. A função `create_request_from_bot` retornará um JSON no mesmo formato dos demais bloqueios para o n8n entregar a mensagem ao WhatsApp.

## Decisões propostas (ajustáveis)

- **Chave interna:** `limite_excedido`
- **Rótulo na UI:** "Limite Excedido"
- **Cor do badge:** vermelho/rosé (`bg-rose-100 text-rose-700` / dark `bg-rose-500/15 text-rose-300`) — distinta de férias (azul) e afastado (amarelo), respeitando a paleta neutra da marca
- **Permissão:** Admin e Gestor (igual aos outros status)
- **Mensagem do bot:** "Limite excedido, peça novamente no mês seguinte"
- **Comportamento:** bloqueia criação de qualquer solicitação (igual a férias/afastado). Não há reset automático nessa entrega — RH/Gestor volta o status manualmente para `ativo` quando o ciclo virar (se quiser automação mensal, posso planejar em separado).

## Mudanças

### 1. Banco (migration)

- Acrescentar o valor `'limite_excedido'` onde o status do colaborador é controlado. Hoje `profiles.status` é texto livre (não há enum), então basta atualizar a função do bot e o sync.
- Atualizar `public.create_request_from_bot` para incluir o novo bloqueio antes da validação de admissão:

```sql
IF v_user_status = 'limite_excedido' THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'user_limit_exceeded',
    'message', 'Limite excedido, peça novamente no mês seguinte'
  );
END IF;
```

Formato idêntico aos retornos de `user_on_leave` / `user_on_vacation`, então o n8n só precisa mapear o novo `error`.

### 2. Frontend

- `src/components/colaboradores/EditColaboradorDialog.tsx`: adicionar `{ value: 'limite_excedido', label: 'Limite Excedido' }` na lista de status.
- `src/pages/Colaboradores.tsx`:
  - Novo card/contador (junto com "Férias" e "Afastados").
  - Badge `Limite Excedido` com a cor rosé via tokens.
  - Bloquear ação "Nova solicitação" (mesmo tratamento de `isOnLeave` / `isOnVacation`).
- `src/components/colaboradores/SyncCSVDialog.tsx`: incluir `limite_excedido` na lista de status preservados durante o sync de CSV (para não voltar a `ativo` indevidamente).
- Qualquer outra tela que filtre por `ferias`/`afastado` (Dashboard, Solicitações) recebe o mesmo tratamento de "não pode solicitar".

### 3. Memória

- Atualizar `mem://features/colaboradores-management/collaborator-statuses` incluindo `limite_excedido`.
- Atualizar `mem://infrastructure/database-functions/bot-request-validation-logic` com o novo retorno.

## Confirmação antes de implementar

1. OK chamar a chave de `limite_excedido` e rótulo "Limite Excedido"?
2. OK usar **rosé/vermelho suave** como cor? (alternativas: âmbar, laranja queimado, grafite)
3. Quer que eu já planeje um job mensal pra zerar automaticamente esse status no dia 1º, ou deixa manual por enquanto?
