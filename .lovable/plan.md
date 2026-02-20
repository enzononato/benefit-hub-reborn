
## Mudanças na Lógica de Sync e Prévia

### O que muda

**Mudança 1 — Regra de demissão**

A lógica anterior protegia colaboradores com status `ferias` ou `afastado` de serem demitidos se ausentes do CSV. A nova regra é mais simples: se não está no CSV, vai ser demitido, independente do status atual.

Isso afeta dois lugares:

- **Prévia (`handleFileUpload`):** A query do banco que busca quem pode ser demitido hoje filtra `.eq('status', 'ativo')`. Precisa mudar para incluir `ferias` e `afastado` também, ou remover o filtro e incluir todos os não-demitidos:
  ```ts
  // De:
  .eq('status', 'ativo')
  // Para:
  .in('status', ['ativo', 'ferias', 'afastado'])
  ```
  E o loop de `toTerminate` — que atualmente já itera sobre `activeColaboradores` — já vai incluir todos naturalmente.

- **Sync real (`handleSync`, linha 362):** Remover o filtro `.eq('status', 'ativo')` que impede a demissão de férias/afastados (esse filtro foi adicionado no plano anterior mas a lógica atual do código não o tem — confirmado na linha 360-363, o update já aplica em todos os CPFs do `toTerminate` sem filtro de status, o que está correto).

**Mudança 2 — Lista de novos colaboradores na prévia**

Atualmente a prévia mostra uma lista dos colaboradores que serão demitidos (nomes e CPFs). Precisa adicionar uma seção equivalente para os que serão **criados**, mostrando nome e CPF de cada novo colaborador, com o mesmo comportamento de truncamento (mostrar os 20 primeiros + "e mais X").

### Arquivos a modificar

**`src/components/colaboradores/SyncCSVDialog.tsx`** — 2 alterações:

**Alteração 1** — Linha 146: query da prévia, incluir férias e afastados no pool de comparação e demissão
```ts
// De:
.eq('status', 'ativo');
// Para:
.in('status', ['ativo', 'ferias', 'afastado']);
```
Com isso, a linha 182 (`for (const profile of activeColaboradores)`) já vai incluir os colaboradores de férias/afastados no cálculo de quem demitir automaticamente.

**Alteração 2** — Após o bloco de listagem de demitidos (linha ~500), adicionar bloco equivalente para novos colaboradores:
```tsx
{preview.toCreate.length > 0 && (
  <div className="p-3 rounded-lg bg-muted">
    <p className="text-sm font-medium text-muted-foreground mb-2">
      Novos colaboradores que serão criados:
    </p>
    <div className="max-h-32 overflow-y-auto space-y-1">
      {preview.toCreate.slice(0, 20).map((t, i) => (
        <p key={i} className="text-sm text-foreground">{t.name} — {t.cpf}</p>
      ))}
      {preview.toCreate.length > 20 && (
        <p className="text-sm text-muted-foreground">
          ... e mais {preview.toCreate.length - 20}
        </p>
      )}
    </div>
  </div>
)}
```

### Resumo da nova lógica de demissão

| Status no banco | No CSV | Ação |
|---|---|---|
| `ativo` | Sim | Atualizar |
| `ferias` | Sim | Atualizar (preserva status férias) |
| `afastado` | Sim | Atualizar (preserva status afastado) |
| `ativo` | Não | **Demitir** |
| `ferias` | Não | **Demitir** ← mudança |
| `afastado` | Não | **Demitir** ← mudança |
| `demitido` | Não | Ignorar |

### O que NÃO muda
- A preservação de status (`ferias`/`afastado`) para quem **está** no CSV continua igual — linha 269 não é alterada.
- O mapeamento de códigos de unidade `RV-XX` permanece intacto.
- Nenhuma alteração no banco de dados.
