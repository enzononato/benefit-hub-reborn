
# Plano: Aprovação em Duas Etapas para Alteração de Férias

## Resumo
Implementar um fluxo de aprovação em duas etapas para solicitações do tipo "Alteração de Férias":
1. **Primeira etapa**: Aprovação pelo RH
2. **Segunda etapa**: Aprovação final pelo Agente de DP ou Gestor (só aparece após aprovação do RH)

Se o RH recusar, a solicitação é encerrada diretamente.

---

## Arquitetura da Solução

### Novos Status de Workflow

O sistema atual possui: `aberta` → `em_analise` → `aprovada`/`recusada`

Para o tipo `alteracao_ferias`, o fluxo será expandido para:

```
aberta → em_analise → aguardando_rh → aprovada_rh → (DP vê) → aprovada/recusada
                                    ↘ recusada (encerra)
```

### Opção Escolhida: Adicionar campos na tabela existente

Ao invés de criar uma nova tabela de aprovações, vamos adicionar campos à tabela `benefit_requests`:
- `hr_status`: status da aprovação do RH (null, 'pendente', 'aprovada', 'recusada')
- `hr_reviewed_by`: UUID do usuário RH que aprovou/recusou
- `hr_reviewed_at`: data/hora da revisão do RH
- `hr_notes`: observações do RH

---

## Etapas de Implementação

### 1. Banco de Dados

#### 1.1 Adicionar nova função ao enum `app_role`
```sql
ALTER TYPE public.app_role ADD VALUE 'rh';
```

#### 1.2 Adicionar colunas na tabela `benefit_requests`
```sql
ALTER TABLE public.benefit_requests
ADD COLUMN hr_status text DEFAULT NULL,
ADD COLUMN hr_reviewed_by uuid DEFAULT NULL,
ADD COLUMN hr_reviewed_at timestamptz DEFAULT NULL,
ADD COLUMN hr_notes text DEFAULT NULL;
```

#### 1.3 Criar função helper `has_role` para o novo papel
A função `has_role` existente já suporta o novo valor do enum.

#### 1.4 Atualizar políticas RLS para RH
```sql
-- RH pode visualizar solicitações de alteração de férias
CREATE POLICY "RH can view alteracao_ferias requests"
ON public.benefit_requests
FOR SELECT
USING (
  has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
);

-- RH pode atualizar campos de aprovação RH
CREATE POLICY "RH can update hr fields on alteracao_ferias"
ON public.benefit_requests
FOR UPDATE
USING (
  has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
)
WITH CHECK (
  has_role(auth.uid(), 'rh'::app_role) 
  AND benefit_type = 'alteracao_ferias'
);
```

---

### 2. Backend (Lógica de Visibilidade)

Modificar a query do `useBenefitRequests.ts` para:
- **RH**: Só vê solicitações de `alteracao_ferias` que estão em `em_analise` e não foram ainda revisadas pelo RH
- **DP/Gestor**: Só vê solicitações de `alteracao_ferias` se o RH já aprovou (`hr_status = 'aprovada'`)

---

### 3. Frontend

#### 3.1 Atualizar `AuthContext.tsx`
Adicionar 'rh' ao tipo `AppRole`.

#### 3.2 Atualizar `src/pages/Usuarios.tsx`
Adicionar opção de criar usuários com função "RH".

#### 3.3 Atualizar `EditarFuncaoDialog.tsx`
Adicionar a função "RH" no dropdown de funções.

#### 3.4 Modificar `SolicitacaoDetailsSheet.tsx`
Para solicitações de `alteracao_ferias`:

**Se usuário é RH:**
- Mostrar botões "Aprovar RH" e "Recusar RH"
- Campo para observações do RH
- Ao aprovar, define `hr_status = 'aprovada'`
- Ao recusar, define `hr_status = 'recusada'` e `status = 'recusada'`

**Se usuário é DP/Gestor:**
- Mostrar badge indicando "Aprovado pelo RH" com nome do aprovador
- Permitir aprovar/recusar normalmente (finalização)

#### 3.5 Criar componente `HrApprovalSection.tsx`
Seção específica para aprovação do RH com:
- Status da aprovação RH
- Nome de quem aprovou
- Data da aprovação
- Observações

#### 3.6 Atualizar indicadores visuais
- Badge "Aguardando RH" para solicitações pendentes de aprovação RH
- Badge "RH Aprovado" verde quando RH já aprovou
- Histórico mostrando as duas etapas de aprovação

---

### 4. Configurações de Acesso

#### 4.1 Rotas protegidas
O RH terá acesso apenas a:
- `/solicitacoes` (filtrado para ver apenas alteração de férias pendentes de RH)

#### 4.2 Permissões de módulos
O RH não usa o sistema de módulos - ele só vê `alteracao_ferias`.

---

## Fluxo Visual do Processo

```
┌─────────────────┐
│   Colaborador   │
│ Abre Solicitação│
└────────┬────────┘
         ▼
┌─────────────────┐
│  Status: aberta │
└────────┬────────┘
         ▼
┌─────────────────┐
│   Qualquer um   │
│   abre detalhes │ → Status: em_analise
└────────┬────────┘
         ▼
         ┌─── Se tipo = alteracao_ferias ───┐
         ▼                                   ▼
┌─────────────────┐               ┌─────────────────┐
│  RH visualiza   │               │ Outros tipos    │
│  e pode aprovar │               │ DP/Gestor       │
│  ou recusar     │               │ aprova direto   │
└────────┬────────┘               └─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│Recusa │ │ Aprova RH │
│       │ │           │
└───┬───┘ └─────┬─────┘
    │           │
    ▼           ▼
┌───────────┐ ┌───────────────────┐
│ Status:   │ │ hr_status:        │
│ recusada  │ │ aprovada          │
│ (FIM)     │ │                   │
└───────────┘ │ Agora visível     │
              │ para DP/Gestor    │
              └─────────┬─────────┘
                        ▼
              ┌─────────────────┐
              │   DP/Gestor     │
              │ aprova/recusa   │
              │ normalmente     │
              └─────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/xxx.sql` | Adicionar valor 'rh' ao enum, colunas hr_*, políticas RLS |
| `src/contexts/AuthContext.tsx` | Adicionar 'rh' ao tipo AppRole |
| `src/types/benefits.ts` | Adicionar labels para status HR |
| `src/hooks/useBenefitRequests.ts` | Filtrar baseado em role e hr_status |
| `src/pages/Usuarios.tsx` | Adicionar opção RH no select |
| `src/components/usuarios/EditarFuncaoDialog.tsx` | Adicionar opção RH |
| `src/components/solicitacoes/SolicitacaoDetailsSheet.tsx` | Lógica de aprovação em duas etapas |
| `src/App.tsx` | Adicionar 'rh' às rotas permitidas em `/solicitacoes` |
| `src/components/ProtectedRoute.tsx` | Sem alterações necessárias |
| `src/integrations/supabase/types.ts` | Será regenerado automaticamente |

---

## Considerações de Segurança

1. **RLS**: Políticas garantem que RH só pode ver/modificar `alteracao_ferias`
2. **Enum**: O papel 'rh' é armazenado na tabela `user_roles`, seguindo o padrão existente
3. **Auditoria**: Logs são criados via `create_system_log` para todas as ações

---

## Estimativa de Complexidade

- **Migração DB**: Média (adicionar enum value, colunas, políticas)
- **Backend (hooks)**: Média (lógica de filtro por role)
- **Frontend**: Alta (UI de aprovação em duas etapas)
- **Total**: ~3-4 etapas de implementação
