

## Recusar em massa protocolos abertos (não-convênios)

### Situação atual
Existem **21 protocolos abertos** (`status = 'aberta'`) que NÃO são da categoria Convênios. A maioria é `contracheque` (18), além de `relatorio_ponto` (1), `plantao_duvidas` (1) e `alteracao_ferias` (2).

Os tipos de Convênios são: `autoescola`, `farmacia`, `oficina`, `vale_gas`, `papelaria`, `otica` — estes NÃO serão afetados.

### O que será feito

Executar um UPDATE direto no banco de dados para recusar todos os 21 protocolos:

```sql
UPDATE benefit_requests
SET 
  status = 'recusada',
  rejection_reason = 'Resolvido e encerrado pelo chatwoot',
  closed_at = NOW(),
  updated_at = NOW()
WHERE status = 'aberta'
  AND benefit_type NOT IN ('autoescola', 'farmacia', 'oficina', 'vale_gas', 'papelaria', 'otica');
```

### Mensagem ao colaborador
Nenhuma mensagem será enviada — o envio de WhatsApp acontece apenas pelo frontend, e esta operação será feita diretamente no banco.

### Impacto
- 21 protocolos serão marcados como `recusada`
- Protocolos de convênios permanecerão inalterados
- Nenhuma notificação será disparada ao colaborador

