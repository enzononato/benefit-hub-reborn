import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PROTOCOL = 'REVALLE-26030911002998';
const STORAGE_FILE_NAME = `${PROTOCOL}_replaced.pdf`;
const LOCAL_PDF_PATH = '/temp-upload.pdf';

export const TempPdfUploader = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    try {
      setStatus('uploading');
      setMessage('Baixando PDF local...');

      const response = await fetch(LOCAL_PDF_PATH);
      if (!response.ok) throw new Error('Falha ao buscar PDF local');
      const blob = await response.blob();
      const file = new File([blob], STORAGE_FILE_NAME, { type: 'application/pdf' });

      setMessage('Fazendo upload para o bucket...');

      const { error: uploadError } = await supabase.storage
        .from('benefit-pdfs')
        .upload(STORAGE_FILE_NAME, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('benefit-pdfs')
        .getPublicUrl(STORAGE_FILE_NAME);

      const newPdfUrl = urlData.publicUrl;

      setMessage('Atualizando registro no banco...');

      const { error: updateError } = await supabase
        .from('benefit_requests')
        .update({
          pdf_url: newPdfUrl,
          pdf_file_name: 'Termo_de_opção_por_benefício_PE_-_VALE_GAS_-_MICHEL_RODRIGUES_COSTA.pdf',
        })
        .eq('protocol', PROTOCOL);

      if (updateError) throw updateError;

      setStatus('done');
      setMessage(`PDF substituído com sucesso! Nova URL: ${newPdfUrl}`);
    } catch (err: any) {
      setStatus('error');
      setMessage(`Erro: ${err.message}`);
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, background: '#1a1a2e', color: '#fff', padding: 16, borderRadius: 8, maxWidth: 400 }}>
      <p style={{ fontWeight: 'bold', marginBottom: 8 }}>Substituir PDF — {PROTOCOL}</p>
      {status === 'idle' && (
        <button onClick={handleUpload} style={{ padding: '8px 16px', background: '#4361ee', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Iniciar Upload
        </button>
      )}
      {status === 'uploading' && <p>⏳ {message}</p>}
      {status === 'done' && <p style={{ color: '#06d6a0' }}>✅ {message}</p>}
      {status === 'error' && <p style={{ color: '#ef476f' }}>❌ {message}</p>}
    </div>
  );
};
