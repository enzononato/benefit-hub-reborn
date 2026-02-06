# Memory: features/credit-limit-installment-logic

## Lógica de Limite de Crédito - Dedução Total na Aprovação

O sistema de limite de crédito do colaborador segue um modelo de **dedução total na aprovação**:

### Conceito Principal
- O **valor total** da solicitação é deduzido do limite na aprovação
- A cada mês, conforme o colaborador paga as parcelas (via folha), o valor da parcela é restaurado ao limite
- Após a quitação total, o limite volta ao valor original

### Na Aprovação
- **Valor total** é deduzido imediatamente do `credit_limit` do perfil do colaborador
- Validação bloqueia aprovação se o **valor total** exceder o limite disponível
- Os campos `approved_value`, `total_installments` e `paid_installments` são preenchidos na tabela `benefit_requests`

### Mensalmente (Cron Job)
- Job `process-monthly-installments` é executado no dia 1 de cada mês às 00:00 UTC via `pg_cron`
- Busca solicitações aprovadas onde `paid_installments < total_installments`
- Para cada solicitação pendente:
  1. **Restaura** o valor da parcela paga ao limite do colaborador
  2. Incrementa `paid_installments`

### Exemplo Prático
Colaborador com limite de R$1.000 solicita R$600 em 3x de R$200:

| Momento | Ação | Limite |
|---------|------|--------|
| Inicial | - | R$1.000 |
| Aprovação | Deduz valor total (-R$600) | R$400 |
| Mês 2 | Restaura parcela paga (+R$200) | R$600 |
| Mês 3 | Restaura parcela paga (+R$200) | R$800 |
| Quitação | Restaura última parcela (+R$200) | R$1.000 |

### Validação de Aprovação
- Bloqueia se: `valor_total > credit_limit` (limite atual)
- O objetivo é garantir que o colaborador tenha capacidade de pagar o valor total comprometido

### Campos Relevantes
- `profiles.credit_limit`: Limite atual do colaborador (atualizado na aprovação e mensalmente)
- `benefit_requests.approved_value`: Valor total aprovado
- `benefit_requests.total_installments`: Número total de parcelas
- `benefit_requests.paid_installments`: Parcelas já registradas como pagas

### Benefícios do Modelo de Dedução Total
1. **Controle rigoroso**: Limite reflete todo o comprometimento futuro
2. **Previsibilidade**: Colaborador sabe exatamente quanto está comprometido
3. **Liberação gradual**: Limite é restaurado conforme as parcelas são pagas
