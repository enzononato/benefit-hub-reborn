

# Plano: Limitar Tamanho do Nome de Arquivo nos Botões de Upload

## Problema Identificado

Quando um arquivo com nome muito longo é selecionado para upload, o nome completo é exibido dentro do botão, fazendo com que ele expanda e quebre o layout dos detalhes do protocolo.

Os elementos afetados estao nos botões de upload de PDF/arquivo que exibem `pdfFile.name` diretamente sem truncar.

---

## Solução

Criar uma função utilitária para truncar nomes de arquivos muito longos e aplicá-la nos botões de upload.

### Estratégia de Truncamento

- Manter no máximo **30 caracteres** visíveis
- Preservar a extensão do arquivo (ex: `.pdf`, `.jpg`)
- Formato: `nome-do-arq...ivo.pdf`

---

## Arquivos a Modificar

### 1. `src/components/solicitacoes/SolicitacaoDetailsSheet.tsx`

**Adicionar função de truncamento:**
```typescript
const truncateFileName = (name: string, maxLength: number = 30) => {
  if (name.length <= maxLength) return name;
  
  const extension = name.lastIndexOf('.') > -1 
    ? name.slice(name.lastIndexOf('.')) 
    : '';
  const nameWithoutExt = name.slice(0, name.lastIndexOf('.') || name.length);
  const truncatedLength = maxLength - extension.length - 3; // 3 para "..."
  
  if (truncatedLength <= 0) return name.slice(0, maxLength - 3) + '...';
  
  return nameWithoutExt.slice(0, truncatedLength) + '...' + extension;
};
```

**Aplicar nos botões (linhas 1101 e 1134):**
```typescript
// Linha 1101 - Upload de PDF
{pdfFile ? truncateFileName(pdfFile.name) : pdfUrl ? "Substituir PDF" : "Selecionar PDF"}

// Linha 1134 - Upload de Atestado
{pdfFile ? truncateFileName(pdfFile.name) : pdfUrl ? "Substituir arquivo" : "Selecionar arquivo"}
```

**Adicionar estilos ao botão para garantir truncamento:**
- Adicionar `truncate` e `max-w-full` às classes do botão

### 2. `src/components/benefits/BenefitDetailsSheet.tsx`

Aplicar a mesma correção na linha 524.

---

## Detalhes Técnicos

### Função truncateFileName

```typescript
const truncateFileName = (name: string, maxLength: number = 30): string => {
  if (name.length <= maxLength) return name;
  
  const lastDot = name.lastIndexOf('.');
  const extension = lastDot > -1 ? name.slice(lastDot) : '';
  const baseName = lastDot > -1 ? name.slice(0, lastDot) : name;
  
  const availableLength = maxLength - extension.length - 3;
  
  if (availableLength <= 0) {
    return name.slice(0, maxLength - 3) + '...';
  }
  
  return baseName.slice(0, availableLength) + '...' + extension;
};
```

### Exemplos de Resultado

| Nome Original | Resultado |
|--------------|-----------|
| `documento.pdf` | `documento.pdf` (sem alteração) |
| `arquivo_muito_grande_com_nome_enorme.pdf` | `arquivo_muito_grande_co....pdf` |
| `1234567890123456789012345678901234567890.jpg` | `123456789012345678901....jpg` |

### Classes CSS Adicionais no Botão

```typescript
<Button
  className="w-full overflow-hidden"
>
  <FileUp className="w-4 h-4 mr-2 flex-shrink-0" />
  <span className="truncate">
    {pdfFile ? truncateFileName(pdfFile.name) : ...}
  </span>
</Button>
```

---

## Resultado Esperado

- Nomes de arquivo longos serão truncados com "..." no meio
- A extensão do arquivo será preservada para clareza
- O layout dos detalhes do protocolo permanecerá estável
- O usuário ainda poderá ver o arquivo completo ao passar o mouse (com title)

