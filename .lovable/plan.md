

## Preservar status de colaboradores em férias/afastados durante o Sync

### Problema
Na linha 248 do `SyncCSVDialog.tsx`, o sync força `status: 'ativo'` para todos os colaboradores encontrados no CSV. Isso sobrescreve o status de quem está marcado como `ferias` ou `afastado`.

### Solucao
Buscar o status atual do colaborador antes do update e, se for `ferias` ou `afastado`, preservar esse status em vez de forçar `ativo`. Apenas colaboradores com status `demitido` (ou qualquer outro) terão o status atualizado para `ativo`.

### Detalhes tecnicos

**Arquivo:** `src/components/colaboradores/SyncCSVDialog.tsx`

1. Criar um mapa `cpfToStatus` com o status atual de cada colaborador existente (junto ao mapa `cpfToProfileId` ja existente).
2. Na construcao do `toUpdateBatch`, verificar o status atual:
   - Se `ferias` ou `afastado` -> manter o status atual
   - Caso contrario -> definir como `ativo`

Trecho simplificado da logica:

```typescript
const currentStatus = cpfToStatus.get(cpf);
const preserveStatus = currentStatus === 'ferias' || currentStatus === 'afastado';

// No objeto de update:
status: preserveStatus ? currentStatus : 'ativo',
```

Nenhuma alteracao de banco de dados e necessaria, apenas logica no componente.

