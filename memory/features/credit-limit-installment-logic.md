# Memory: features/credit-limit-installment-logic

## Lógica de Limite de Crédito Rotativo

O sistema de limite de crédito do colaborador segue um modelo de **crédito rotativo**:

### Conceito Principal
- O limite fica "comprometido" apenas pelo valor de **uma parcela por vez**
- Quando o colaborador paga uma parcela (via folha de pagamento), o valor é restaurado ao limite
- Após a quitação total, o limite volta ao valor original

### Na Aprovação
- **Primeira parcela** é deduzida imediatamente do `credit_limit` do perfil do colaborador
- Validação bloqueia aprovação apenas se o **valor da parcela** exceder o limite atual
- Os campos `approved_value`, `total_installments` e `paid_installments` são preenchidos na tabela `benefit_requests`

### Mensalmente (Cron Job)
- Job `process-monthly-installments` é executado no dia 1 de cada mês às 00:00 UTC via `pg_cron`
- Busca solicitações aprovadas onde `paid_installments < total_installments`
- Para cada solicitação pendente:
  1. **Restaura** o valor da parcela anterior (colaborador pagou via folha)
  2. Se **não é a última parcela**: deduz a próxima parcela
  3. Se **é a última parcela**: apenas restaura (limite volta ao original)
  4. Incrementa `paid_installments`

### Exemplo Prático
Colaborador com limite de R$1.000 solicita R$600 em 3x de R$200:

| Momento | Ação | Limite |
|---------|------|--------|
| Inicial | - | R$1.000 |
| Aprovação | Deduz 1ª parcela | R$800 |
| Mês 2 | Restaura parcela paga (+R$200), deduz 2ª parcela (-R$200) | R$800 |
| Mês 3 | Restaura parcela paga (+R$200), deduz 3ª parcela (-R$200) | R$800 |
| Quitação | Restaura última parcela (+R$200) | R$1.000 |

### Validação de Aprovação
- Bloqueia se: `valor_parcela > credit_limit` (limite atual)
- Permite aprovar mesmo se houver outras solicitações em andamento
- O objetivo é garantir que o colaborador sempre tenha capacidade de pagar pelo menos uma parcela

### Campos Relevantes
- `profiles.credit_limit`: Limite atual do colaborador (atualizado mensalmente)
- `benefit_requests.approved_value`: Valor total aprovado
- `benefit_requests.total_installments`: Número total de parcelas
- `benefit_requests.paid_installments`: Parcelas já registradas como pagas

### Benefícios do Modelo Rotativo
1. **Limite preservado**: Colaborador não perde todo o limite de uma vez
2. **Flexibilidade**: Pode fazer novas solicitações enquanto paga as anteriores
3. **Previsibilidade**: Limite sempre reflete apenas a próxima parcela a ser descontada
