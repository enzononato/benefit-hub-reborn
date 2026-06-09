# Encerramento em massa de protocolos não-convênio

## Objetivo
Encerrar todos os protocolos em aberto (status `aberta` ou `em_analise`) que **não** sejam de convênios, marcando-os como `recusada` com a mensagem "Encerrado pelo Chatwoot", **sem disparar o webhook do n8n**.

## Escopo (35 protocolos identificados)
Tipos considerados **convênios** (mantidos intactos): `autoescola`, `farmacia`, `oficina`, `vale_gas`, `papelaria`, `otica`.

Todos os demais tipos com status `aberta`/`em_analise` serão encerrados. Quantitativo atual:

- alteracao_ferias: 2
- aviso_folga_falta: 1
- atestado: 1
- contracheque: 13
- abono_horas: 3
- alteracao_horario: 1
- relatorio_ponto: 1
- plantao_duvidas: 13

**Total: 35 protocolos**

## Ação
Operação única de `UPDATE` no banco (sem código/edge function, sem chamada de webhook):

- `status` → `recusada`
- `rejection_reason` → `Encerrado pelo Chatwoot`
- `closing_message` → `Encerrado pelo Chatwoot`
- `closed_at` → `now()`
- `updated_at` → `now()`

Filtro:
```sql
WHERE status IN ('aberta','em_analise')
  AND benefit_type NOT IN ('autoescola','farmacia','oficina','vale_gas','papelaria','otica')
```

Como é um UPDATE direto no banco, **nenhum webhook é disparado** (o webhook só é chamado pelo frontend em `BenefitDetailsSheet`).

## Confirmação
Posso prosseguir com o UPDATE nos 35 protocolos listados?
