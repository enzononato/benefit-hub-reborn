## Objetivo

Trocar a "cara amadora" do app por um visual **corporativo confiável** estilo Notion/Stripe Dashboard, mantendo 100% das funcionalidades. Foco em consistência, hierarquia tipográfica forte, paleta neutra e densidade compacta.

**Garantia de não-quebra:** mudamos apenas tokens CSS e estilos visuais de componentes. Nenhuma alteração de dados, rotas, lógica, hooks, queries, banco ou estrutura de props públicas. Cada commit pode ser revertido isoladamente.

---

## Direção visual

- **Sem roxo.** Paleta neutra zinc/slate como base, com **azul-grafite escuro** (`#1F2937` / `#0F172A`) como cor de ação principal — confiável, corporativo, neutro de marca.
- **Acentos semânticos** apenas para estado: verde (success), âmbar (warning), vermelho (destructive), azul (info).
- **Tipografia:** mantém DM Sans, mas hierarquia mais forte (h1 28px/700, h2 18px/600, body 13px/400, label 11px uppercase tracking-wide).
- **Densidade compacta:** padding base 12px (era 16-24), inputs/botões h-9 (era h-10), tabela com row 36px, cards mais "apertados".
- **Bordas/sombras:** raio reduzido para 8px (era 12px), sombras quase imperceptíveis (`0 1px 2px rgb(0 0 0 / 0.04)`), foco em separadores 1px sólidos com cor de border bem sutil.
- **Sem efeitos exagerados:** remove `hover:scale-[1.02]`, animações de "ping" piscando, shimmer pesado nos skeletons. Mantém só transições de cor/sombra.

---

## Etapa 1 — Design tokens (`src/index.css` + `tailwind.config.ts`)

Reescreve as variáveis CSS dos temas light e dark com paleta nova:

**Light:**
- `--background: 0 0% 100%` (branco puro)
- `--foreground: 222 47% 11%` (quase preto)
- `--card: 0 0% 100%`
- `--muted: 210 20% 98%` / `--muted-foreground: 215 16% 47%`
- `--border: 214 15% 91%` / `--input: 214 15% 91%`
- `--primary: 222 47% 11%` (grafite escuro — botões primários)
- `--primary-foreground: 0 0% 100%`
- `--accent: 210 20% 96%` (hover sutil)
- `--ring: 222 47% 11%`
- `--success: 142 71% 36%` / `--warning: 38 92% 45%` / `--destructive: 0 72% 45%` / `--info: 217 91% 50%`
- `--radius: 0.5rem`

**Dark:**
- `--background: 222 47% 6%` (quase preto, não cinza)
- `--card: 222 47% 9%`
- `--foreground: 210 20% 96%`
- `--muted: 222 30% 13%` / `--muted-foreground: 215 14% 60%`
- `--border: 222 25% 18%`
- `--primary: 0 0% 100%` (botões primários invertem para branco no dark)
- `--primary-foreground: 222 47% 11%`
- mesmos semânticos calibrados

**Sidebar (ambos os temas):** mantém escura mas troca a base — `--sidebar-background: 222 47% 8%`, sem tom azul/roxo, e `--sidebar-primary` igual ao foreground (highlight branco/cinza claro em vez de roxo).

**Tokens de benefit:** mantém os pares `--benefit-*` mas recalibrados para tons mais sóbrios (slate/zinc/stone-100 com ícones em 600). Continuam sendo só decoração de ícone, nada de cor de marca.

Remove a animação `bellShake` exagerada e suaviza `shimmer` (opacidade menor, mais lento).

---

## Etapa 2 — Componentes base (shadcn)

Ajustes pontuais de classe (sem mudar API):

- **`button.tsx`** — `h-9 px-3.5` no default, `h-8 px-3` no sm, raio `rounded-md`, remove `gap-2` excessivo, peso `font-medium`. Variant `outline` ganha `border-border bg-background hover:bg-muted`.
- **`input.tsx`** — `h-9`, `text-sm`, `border-border`, foco com `ring-1 ring-ring` (não 2), placeholder `text-muted-foreground/70`.
- **`card.tsx`** — `rounded-lg border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]`, header `p-4 pb-3`, content `p-4 pt-0`.
- **`table.tsx`** — `TableHead` com `h-9 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40`, `TableRow` com `h-10 hover:bg-muted/40 border-b border-border`, células `py-2 text-sm`.
- **`badge.tsx`** — versões mais sóbrias: outline com `border-border text-foreground`, semânticas com background `/10` e texto sólido.
- **`status-badge.tsx`** — pill estilo Stripe: `h-5 px-2 text-[11px] font-medium rounded-full` com bolinha de status à esquerda em vez de cor de fundo forte.
- **`skeleton.tsx`** — animação mais lenta e sutil.
- **`dialog.tsx`/`sheet.tsx`** — overlay `bg-foreground/40 backdrop-blur-sm`, content com sombra mais discreta.
- **`tabs.tsx`** — tabs estilo "underline" (linha embaixo da tab ativa) em vez de fundo colorido.

Nenhum `displayName`, prop ou export é tocado.

---

## Etapa 3 — Layout (Sidebar + MainLayout)

`src/components/layout/Sidebar.tsx`:
- Logo block mais discreto: `h-14`, sem subtítulo "Gestão de Protocolos" colado (ou move para tooltip).
- Nav items: `h-8 px-2.5 text-[13px]`, ícones `h-4 w-4`, espaçamento `gap-2.5`.
- Item ativo: fundo `bg-sidebar-accent` com **barra lateral de 2px à esquerda** em `--sidebar-foreground`, em vez de fundo roxo.
- Badge de contagem: pill discreta com `bg-foreground/10 text-foreground` em vez de border colorida.
- Bloco do usuário no rodapé: linha única, avatar 28px, sem card visual ao redor.
- Toggle de tema: vira um `Switch` ou ícone-only sem label "Tema".

`MainLayout.tsx`:
- Header mobile: `h-12` (era `h-14`).
- Container principal: `p-4 lg:p-6` (em vez de `lg:p-8`), `max-w-screen-2xl mx-auto`.

---

## Etapa 4 — Dashboard

`src/pages/Dashboard.tsx` + componentes filhos:

- **DashboardHeader:** remove o emoji 👋, h1 fica `text-2xl font-semibold tracking-tight`, data e "atualizado às" viram uma linha só com `text-xs text-muted-foreground`. Botão "Atualizar" vira `ghost` `size-sm` icon-only com tooltip.
- **StatCard:** redesenho completo no estilo Stripe Dashboard:
  - Card branco/card, padding `p-4`, sem variantes de fundo colorido.
  - Layout: label pequena em cima (uppercase 11px), número grande embaixo (28px font-semibold), ícone discreto no canto superior direito em `bg-muted text-muted-foreground` (sem cor por variante).
  - A "variante" agora só pinta uma **bolinha de 6px ao lado da label** (verde/âmbar/vermelho/azul) — sutil e legível.
  - Remove `hover:scale`, mantém só `hover:border-foreground/20`.
- **BenefitCategoryCards:** mantém grid mas:
  - Cards com `p-3` (não `p-4`), ícone `h-5 w-5` em círculo `p-2` (não `p-3`).
  - Tokens de cor recalibrados (já feito na Etapa 1) — paleta mais sóbria.
  - Remove o "ping" piscando de cards com count > 0; substitui por um pequeno `text-xs text-foreground font-medium` no contador (que já existe) e um dot estático.
  - Botão "Ver todos / Fechar" vira link discreto.
- **BenefitsChart / AgentPerformanceChart:** card padrão novo, paleta de gráficos atualizada para tons neutros + 1 acento (grafite/azul/verde, sem roxo). Atualiza `--chart-1..5` no `index.css`.
- **RecentRequests:** lista mais compacta, separadores `border-b` em vez de cards individuais.

---

## Etapa 5 — Solicitações (Protocolos)

`src/pages/Solicitacoes.tsx`:

- **Header da página:** título `text-2xl font-semibold` + subtítulo `text-sm text-muted-foreground` numa linha. Botões de ação (Atualizar, Exportar, Exportar folha) agrupados à direita, todos `size-sm`, ícones consistentes.
- **Filtros:** vira uma única barra horizontal compacta acima da tabela (search + selects + date range + clear), em vez de cards/blocos. Estilo Linear/Notion: tudo `h-8`, separados por `gap-2`, sem fundo de card.
- **Cards de stats no topo (se existirem)** seguem o novo `StatCard`.
- **Tabela:** usa o novo `TableHead`/`TableRow` compacto. Colunas:
  - Status vira pill com bolinha (do novo `StatusBadge`).
  - Tipo de benefício vira ícone + label inline (ícone 14px em `text-muted-foreground`, label `text-sm`), sem círculo colorido por trás.
  - Data em `text-xs text-muted-foreground tabular-nums`.
  - Linha clicável inteira, hover sutil.
- **Paginação:** controles `size-sm`, alinhados à direita, com texto "1–10 de 234" à esquerda.
- **Highlight de novas requests:** troca o fundo amarelo/animado por uma **barra azul de 2px à esquerda da linha** que some após N segundos.
- **Empty state:** ilustração simples (ícone grande em `text-muted-foreground/30`) + título + subtítulo + CTA.

`SolicitacaoDetailsSheet.tsx` — só ajustes visuais (espaçamentos, tipografia, badges) para casar com o novo padrão. Nenhuma mudança em campos ou lógica de aprovação.

---

## O que NÃO muda

- Nenhuma rota, nenhuma página nova/removida.
- Nenhum hook, query, mutation, edge function, RLS, schema.
- Nenhuma prop pública de componente shadcn (só `className` interno).
- Lógica de permissões, SLA, exportação, chat, notificações — intactas.
- Páginas Colaboradores, Unidades, Usuários, Auditoria, Configurações, Auth — **herdam o novo visual automaticamente** via tokens + componentes base, sem reescrita dedicada nesta entrega. Se algo ficar visualmente fora do padrão lá, tratamos numa rodada seguinte.

---

## Memórias a salvar (após aprovação)

- `mem://design/brand-no-color` — "Marca Revalle não tem cor. Não usar roxo. Paleta neutra (zinc/slate) + grafite escuro como ação primária."
- `mem://design/visual-direction` — estilo Notion/Stripe, densidade compacta, hierarquia tipográfica forte, sombras sutis, tokens calibrados light+dark.
- Atualiza `mem://index.md` com Core: "Sem roxo. Paleta neutra. Densidade compacta. Estilo corporativo Notion/Stripe."

---

## Ordem de execução

1. Tokens (`index.css`) + `tailwind.config.ts` — base de tudo.
2. Componentes shadcn base (button, input, card, table, badge, status-badge, dialog, sheet, tabs, skeleton).
3. Sidebar + MainLayout.
4. Dashboard (header, StatCard, BenefitCategoryCards, charts, RecentRequests).
5. Solicitações (header, filtros, tabela, paginação, sheet).
6. Salvar memórias.

Cada etapa é independente; se algo não agradar visualmente em uma, ajustamos só aquela sem mexer no resto.

---

## Resultado esperado

App com cara de produto SaaS sério (Stripe/Linear/Notion): muito branco, tipografia firme, cinza/grafite como cor "de marca", acentos semânticos só onde fazem sentido, densidade alta para uso operacional, dark mode tão polido quanto o light. Zero quebra funcional.
