

## Substituir PDF do protocolo REVALLE-26030911002998

### Situação atual
- O protocolo `REVALLE-26030911002998` tem um PDF armazenado no bucket `benefit-pdfs` com URL:
  `https://wyhlezxtfhoolrvuqhfy.supabase.co/storage/v1/object/public/benefit-pdfs/REVALLE-26030911002998_1773077140805.pdf`
- O campo `pdf_file_name` está `null`

### O que fazer

1. **Copiar o PDF enviado** para o projeto (pasta pública temporária para upload)
2. **Criar um script/lógica no frontend** que faz upload do novo arquivo para o bucket `benefit-pdfs` no Supabase Storage, substituindo o arquivo antigo
3. **Atualizar o registro** na tabela `benefit_requests` com a nova URL e nome do arquivo

### Abordagem mais direta

Como é uma operação pontual (substituir um único arquivo), a forma mais simples é:

1. Copiar o arquivo para `public/` no projeto
2. Usar uma migration SQL para atualizar os campos `pdf_url` e `pdf_file_name` no banco, apontando para o novo arquivo no storage
3. Fazer o upload do arquivo diretamente via Supabase Storage API (usando o SDK no código ou manualmente)

**Porém**, como não consigo fazer upload direto ao Storage via SQL, a melhor abordagem é:

1. Copiar o PDF para `public/temp-pdf/` no projeto
2. Adicionar um pequeno trecho temporário na aplicação que, ao carregar, faz upload do PDF para o bucket `benefit-pdfs` e atualiza o registro — ou, mais simplesmente, **orientar o usuário a fazer o upload manual via dashboard do Supabase Storage** e depois rodar uma migration para atualizar o campo `pdf_url`.

### Plano final

**Passo 1** — Copiar o PDF do usuário para `public/` do projeto

**Passo 2** — Criar um componente/script utilitário temporário que:
- Busca o PDF de `public/`
- Faz upload para o bucket `benefit-pdfs` com nome `REVALLE-26030911002998_replaced.pdf`
- Atualiza `benefit_requests` com a nova `pdf_url` e `pdf_file_name`
- Mostra confirmação

**Passo 3** — Após confirmação, remover o código temporário

Alternativamente, se preferir não adicionar código temporário, posso orientar a fazer o upload pelo dashboard do Supabase e rodar o SQL de update.

### Arquivo modificado
- `public/temp-upload.pdf` — cópia do arquivo enviado
- `src/pages/Solicitacoes.tsx` — adicionar botão/lógica temporária de upload (removido depois)
- Migration SQL para atualizar `pdf_url` e `pdf_file_name` após upload

