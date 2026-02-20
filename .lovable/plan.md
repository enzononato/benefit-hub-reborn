
## Suporte aos Códigos de Unidade do CSV (RV-XX)

### Problema

O CSV usa códigos no formato `RV-AL`, `RV-BF`, etc., enquanto o banco de dados registra as unidades com os códigos `ALA`, `BON`, etc. Isso faz com que `unitMap.get('RV-AL')` retorne `undefined`, e todos os colaboradores sejam salvos sem unidade vinculada (`unit_id = null`).

### Solução

Adicionar uma constante de mapeamento de aliases e uma função auxiliar `resolveUnitCode` no `SyncCSVDialog.tsx`. Em dois pontos do código onde o `unitCode` é usado para buscar o ID da unidade, a chamada `unitMap.get(unitCode)` será substituída por `unitMap.get(resolveUnitCode(unitCode))`.

### Mapeamento exato

```
RV-AL  →  ALA  (Revalle Alagoinhas)
RV-BF  →  BON  (Revalle Bonfim)
RV-JZ  →  JUA  (Revalle Juazeiro)
RV-PA  →  PAF  (Revalle Paulo Afonso)
RV-PE  →  PET  (Revalle Petrolina)
RV-RP  →  RPO  (Revalle Ribeira do Pombal)
RV-SE  →  SER  (Revalle Serrinha)
```

### Arquivo a modificar

**`src/components/colaboradores/SyncCSVDialog.tsx`**

1. Adicionar antes do componente a constante:
```ts
const UNIT_CODE_ALIASES: Record<string, string> = {
  'RV-AL': 'ALA',
  'RV-BF': 'BON',
  'RV-JZ': 'JUA',
  'RV-PA': 'PAF',
  'RV-PE': 'PET',
  'RV-RP': 'RPO',
  'RV-SE': 'SER',
};

function resolveUnitCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return UNIT_CODE_ALIASES[normalized] ?? normalized;
}
```

2. Linha 236 — durante a análise do preview (função `handleFileUpload`): substituir `unitMap.get(unitCode)` → não aplicável aqui pois o preview não usa unitMap, mas a análise de preview não valida unidade.

3. Linha 236 — durante o sync real (função `handleSync`): substituir:
```ts
const unitId = unitMap.get(unitCode);
```
por:
```ts
const unitId = unitMap.get(resolveUnitCode(unitCode));
```

### O que NÃO muda

- Nenhuma alteração no banco de dados é necessária.
- CSVs que já usam os códigos corretos (`ALA`, `BON`, etc.) continuam funcionando normalmente — a função `resolveUnitCode` retorna o próprio código se não houver alias.
- A lógica de preservação de status `ferias`/`afastado` e de demissão automática não é alterada.
