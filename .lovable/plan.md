## Plano: Valores negativos em vermelho no XLSX (Opção B)

Aplicar formatação numérica nativa do Excel na função `exportApprovedPayrollXLSX` em `src/lib/payrollExport.ts`, sem trocar de biblioteca.

### Mudanças

**Arquivo único**: `src/lib/payrollExport.ts` — apenas a função `exportApprovedPayrollXLSX`.

1. Após criar o worksheet com `XLSX.utils.aoa_to_sheet`, percorrer as células das colunas **H** (Proventos, índice 7) e **I** (descontos, índice 8), a partir da linha 2.
2. Aplicar máscara de número com seções para positivo/negativo/zero:

```ts
const moneyFormat = '#,##0.00;[Red]-#,##0.00;-';
const range = XLSX.utils.decode_range(ws['!ref']!);
for (let R = 1; R <= range.e.r; R++) {
  for (const C of [7, 8]) {
    const ref = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = ws[ref];
    if (cell && typeof cell.v === 'number') {
      cell.t = 'n';
      cell.z = moneyFormat;
    }
  }
}
```

3. Definir larguras de coluna para melhor leitura via `ws['!cols']`.

### O que NÃO muda
- CSV continua igual (formato não suporta cor).
- Sem nova dependência — `xlsx` já está instalado.
- Sem mudança na UI nem no banco.
- Sem mudança no `Solicitacoes.tsx`.

### Resultado esperado
- Coluna **Proventos**: valores positivos em preto, formato contábil `1.234,56`.
- Coluna **descontos**: valores negativos em **vermelho** automaticamente, formato `-1.234,56`.
- Compatível com Excel, LibreOffice e Google Sheets.