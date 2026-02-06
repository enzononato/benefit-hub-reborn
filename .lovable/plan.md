

# Plano: Alterar Lógica de Limite de Crédito para Valor Total

## Resumo da Mudança

**Modelo Atual (Rotativo):** Deduz apenas o valor de uma parcela por vez
**Modelo Novo (Total):** Deduz o valor total aprovado de uma só vez

### Exemplo Prático da Mudança

Colaborador com limite de R$1.000 solicita R$600 em 3x de R$200:

| Modelo | Aprovação | Limite Após |
|--------|-----------|-------------|
| **Atual (Parcela)** | Deduz R$200 (1ª parcela) | R$800 |
| **Novo (Total)** | Deduz R$600 (total) | R$400 |

---

## Arquivos que Serão Modificados

### 1. `src/components/solicitacoes/SolicitacaoDetailsSheet.tsx`

**Na validação (linha ~369):**
- Mudar de: `installmentValue > creditInfo.limit`
- Para: `parsedApprovedValue > creditInfo.limit` (valor total)

**Na dedução do limite (linhas ~542-555):**
- Mudar de: `creditInfo.limit - installmentValue`
- Para: `creditInfo.limit - parsedApprovedValue` (deduz valor total)

**Nas mensagens de erro:**
- Atualizar texto para mencionar "valor total" em vez de "valor da parcela"

### 2. `supabase/functions/process-monthly-installments/index.ts`

**Simplificar a lógica mensal:**
- O job mensal agora só precisa restaurar o valor da parcela conforme é paga
- Não precisa mais fazer a rotação (restaurar + deduzir próxima)
- Na última parcela: comportamento permanece igual (limite já estará correto)

**Lógica atualizada:**
```
Mês X: Colaborador paga parcela → Restaura valor da parcela ao limite
```

Exemplo com R$600 em 3x:
| Momento | Ação | Limite |
|---------|------|--------|
| Aprovação | Deduz R$600 (total) | R$400 |
| Mês 2 | Restaura parcela paga (+R$200) | R$600 |
| Mês 3 | Restaura parcela paga (+R$200) | R$800 |
| Quitação | Restaura última parcela (+R$200) | R$1.000 |

### 3. `memory/features/credit-limit-installment-logic.md`

- Atualizar a documentação para refletir o novo modelo

---

## Detalhes Técnicos

### Mudanças no Frontend (SolicitacaoDetailsSheet.tsx)

**Validação de aprovação:**
```typescript
// ANTES: validava valor da parcela
const exceedsCredit = isConvenio && creditInfo && creditInfo.limit > 0 && installmentValue > creditInfo.limit;

// DEPOIS: valida valor total
const exceedsCredit = isConvenio && creditInfo && creditInfo.limit > 0 && parsedApprovedValue > creditInfo.limit;
```

**Dedução do limite:**
```typescript
// ANTES: deduzia valor da parcela
const newLimit = Math.max(0, creditInfo.limit - installmentValue);

// DEPOIS: deduz valor total
const newLimit = Math.max(0, creditInfo.limit - parsedApprovedValue);
```

### Mudanças no Edge Function (process-monthly-installments)

**Lógica mensal simplificada:**
```typescript
// ANTES: restaurava parcela anterior e deduzia próxima (rotativo)
const restoredLimit = currentLimit + installmentValue;
const newLimit = isLastInstallment 
  ? restoredLimit  
  : restoredLimit - installmentValue;

// DEPOIS: apenas restaura a parcela paga (valor total já foi deduzido)
const newLimit = currentLimit + installmentValue;
```

---

## Considerações

1. **Solicitações existentes:** Solicitações já aprovadas continuarão funcionando normalmente - o cron job restaurará as parcelas conforme forem pagas

2. **Limite mais restritivo:** Com o novo modelo, o colaborador precisa ter o limite total disponível para aprovar, não apenas o valor de uma parcela

3. **Parcelas ainda serão rastreadas:** Os campos `total_installments` e `paid_installments` continuam sendo usados para controlar a restauração mensal do limite

