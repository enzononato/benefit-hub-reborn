# Memory: features/credit-limit-installment-logic

## Lógica de Limite de Crédito e Parcelas

O sistema de limite de crédito do colaborador segue um modelo de **dedução híbrida**:

### Na Aprovação
- **Primeira parcela** é deduzida imediatamente do `credit_limit` do perfil do colaborador
- Validação bloqueia aprovação apenas se o **valor da parcela** exceder o limite total (não o valor disponível)
- Os campos `approved_value`, `total_installments` e `paid_installments` são preenchidos na tabela `benefit_requests`

### Mensalmente (Cron Job)
- Job `process-monthly-installments` é executado no dia 1 de cada mês às 00:00 UTC via `pg_cron`
- Busca solicitações aprovadas onde `paid_installments < total_installments`
- Para cada solicitação pendente:
  - Calcula valor da parcela (`approved_value / total_installments`)
  - Deduz do `credit_limit` do colaborador
  - Incrementa `paid_installments`
- Continua até todas as parcelas serem pagas

### Validação de Aprovação
- Bloqueia se: `valor_parcela > credit_limit` (limite total)
- Permite aprovar mesmo se houver outras solicitações em andamento
- O objetivo é garantir que o colaborador sempre tenha capacidade de pagar pelo menos uma parcela

### Campos Relevantes
- `profiles.credit_limit`: Limite atual do colaborador (atualizado a cada dedução)
- `benefit_requests.approved_value`: Valor total aprovado
- `benefit_requests.total_installments`: Número total de parcelas
- `benefit_requests.paid_installments`: Parcelas já pagas/deduzidas

### Fluxo Completo
1. Colaborador solicita convênio
2. Admin aprova com valor e parcelas
3. **Primeira parcela deduzida imediatamente**
4. Cron mensal deduz parcelas restantes (2ª em diante)
5. Quando `paid_installments == total_installments`, solicitação está quitada
