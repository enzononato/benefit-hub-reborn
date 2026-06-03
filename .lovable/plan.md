# Substituir PDF do protocolo REVALLE-26052610312573

## Passos

1. Localizar o registro em `benefit_requests` pelo protocolo `REVALLE-26052610312573` e ler o `pdf_url` / `pdf_file_name` atuais.
2. Fazer upload do arquivo anexado (`termo_de_opcao_por_beneficio_se-vale_gas-jeferson_lima_basto_freitas-20260603090546434_assinado.pdf`) para o bucket público `benefit-pdfs` (mesmo bucket dos demais PDFs assinados).
3. Atualizar o registro do protocolo no banco com:
   - `pdf_url` = URL pública do novo arquivo
   - `pdf_file_name` = novo nome do arquivo
4. (Opcional) Remover o PDF antigo do storage para não deixar lixo.
5. Registrar um log em `logs` (`create_system_log`) indicando a substituição manual do PDF para fins de auditoria.

## Observações técnicas

- O upload para storage e o `UPDATE` em `benefit_requests` precisam ser feitos via migration/SQL + chamada de storage, pois é uma operação pontual administrativa.
- Confirmar antes que o protocolo existe e qual `pdf_file_name` atual está vinculado.

Confirme para eu executar.