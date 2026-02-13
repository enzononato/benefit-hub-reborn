

# Validacao de Tempo Minimo de Admissao para Convenios

## Objetivo
Adicionar uma validacao na funcao `create_request_from_bot` que bloqueia a criacao de solicitacoes de convenios quando o colaborador nao atinge o tempo minimo de admissao exigido.

## Regras de Negocio

| Tipo de Beneficio | Tempo Minimo de Admissao |
|---|---|
| `vale_gas`, `farmacia` | 30 dias |
| `papelaria`, `otica`, `oficina` | 90 dias |
| `autoescola` | 365 dias (1 ano) |

Demais tipos de beneficio (DP, outros) nao possuem restricao de tempo.

## Comportamento

- Se o colaborador **nao tem** data de admissao cadastrada, a solicitacao sera **bloqueada** para esses tipos de convenio (nao ha como validar).
- Se o colaborador tem data de admissao mas **nao atingiu** o tempo minimo, retorna erro com codigo `insufficient_admission_time`.
- A mensagem de erro informa quantos dias faltam para o colaborador poder solicitar.

## Resposta de Erro (JSON)

```json
{
  "success": false,
  "error": "insufficient_admission_time",
  "message": "Colaborador precisa ter no minimo 90 dias de admissao para solicitar Papelaria. Faltam 45 dias.",
  "required_days": 90,
  "current_days": 45
}
```

Caso nao tenha data de admissao:
```json
{
  "success": false,
  "error": "missing_admission_date",
  "message": "Colaborador nao possui data de admissao cadastrada. Necessario para solicitar convenios."
}
```

## Implementacao Tecnica

### Alteracao na funcao SQL `create_request_from_bot`

Apos a validacao de status do colaborador e o mapeamento do `benefit_type`, sera adicionado um bloco que:

1. Verifica se o `benefit_type` mapeado esta na lista de tipos com restricao
2. Busca o `admission_date` do perfil (campo texto, pode ser `DD/MM/YYYY` ou `YYYY-MM-DD`)
3. Converte para data, calcula a diferenca em dias em relacao a data atual
4. Compara com o minimo exigido e retorna erro se insuficiente

A conversao do campo `admission_date` (texto) para data tratara ambos os formatos:
- `DD/MM/YYYY` (formato brasileiro)
- `YYYY-MM-DD` (formato ISO)

### Arquivo alterado
- **Migracao SQL** para atualizar a funcao `create_request_from_bot` com a nova validacao

Nenhuma alteracao no frontend e necessaria, pois o retorno JSON ja sera tratado pelo fluxo n8n.
