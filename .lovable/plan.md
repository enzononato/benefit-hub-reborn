

# Plano: Adicionar "Alteração de Horário" e "Plantão de Dúvidas" ao Sistema

## Resumo
O tipo `alteracao_horario` já existe no sistema mas não aparece no Dashboard porque não foi incluído no array de cards soltos. Já o `plantao_duvidas` é completamente novo e precisa ser criado em todos os lugares.

---

## Etapa 1: Adicionar `alteracao_horario` ao Dashboard
**Arquivo:** `src/components/dashboard/BenefitCategoryCards.tsx`

O tipo já existe mas está faltando no array `soltoTypes`. Vou adicioná-lo junto com o novo `plantao_duvidas`:

```typescript
// Cards Soltos - de 8 para 10 itens
const soltoTypes: BenefitType[] = [
  'alteracao_ferias', 'aviso_folga_falta', 'atestado', 'contracheque',
  'abono_horas', 'alteracao_horario', 'operacao_domingo', 'relatorio_ponto', 
  'relato_anomalia', 'plantao_duvidas'  // ← adicionados
];
```

Também adicionar ícone e cores para `plantao_duvidas`:
```typescript
iconMap: { plantao_duvidas: HelpCircle }
colorConfig: { plantao_duvidas: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' } }
```

---

## Etapa 2: Adicionar `plantao_duvidas` aos tipos TypeScript
**Arquivo:** `src/types/benefits.ts`

- Adicionar `'plantao_duvidas'` ao tipo `BenefitType`
- Adicionar label: `plantao_duvidas: 'Plantão de Dúvidas'` em `benefitTypeLabels`
- Adicionar em `benefitTypeFilterLabels`

---

## Etapa 3: Adicionar `plantao_duvidas` ao mockData
**Arquivo:** `src/data/mockData.ts`

Adicionar `'plantao_duvidas'` ao array `dpTypes` para manter consistência.

---

## Etapa 4: Criar migração de banco de dados
**Migração SQL necessária:**

```sql
-- Adicionar novo valor ao enum benefit_type
ALTER TYPE benefit_type ADD VALUE IF NOT EXISTS 'plantao_duvidas';
```

---

## Etapa 5: Atualizar função `create_request_from_bot`
A função de banco de dados precisa mapear o novo tipo para que o WhatsApp Bot funcione:

```sql
-- Adicionar no CASE statement:
WHEN 'plantao_duvidas' THEN v_benefit_type := 'plantao_duvidas';

-- Mapeamentos legados:
WHEN 'plantão de dúvidas', 'plantao de duvidas', 'dúvidas', 'duvidas' 
  THEN v_benefit_type := 'plantao_duvidas';
```

---

## Arquivos a serem modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/benefits.ts` | Adicionar `plantao_duvidas` ao tipo e labels |
| `src/data/mockData.ts` | Adicionar ao array `dpTypes` |
| `src/components/dashboard/BenefitCategoryCards.tsx` | Adicionar `alteracao_horario` e `plantao_duvidas` ao `soltoTypes`, ícone e cor |
| Migração SQL | Adicionar enum `plantao_duvidas` e atualizar função do bot |

---

## Resultado esperado
Após implementação, ambos os tipos aparecerão:
- ✅ No Dashboard como cards individuais
- ✅ Nos filtros da página de Solicitações
- ✅ No seletor de tipo ao editar um protocolo
- ✅ Funcionando via WhatsApp Bot

