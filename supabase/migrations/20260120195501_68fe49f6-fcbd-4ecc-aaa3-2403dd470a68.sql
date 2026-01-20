-- Add whatsapp_jid column to benefit_requests table
ALTER TABLE benefit_requests 
ADD COLUMN IF NOT EXISTS whatsapp_jid TEXT;

-- Create index for fast lookups by WhatsApp JID
CREATE INDEX IF NOT EXISTS idx_benefit_requests_whatsapp_jid 
ON benefit_requests(whatsapp_jid) 
WHERE whatsapp_jid IS NOT NULL;

-- Update the create_request_from_bot function to accept whatsapp_jid
CREATE OR REPLACE FUNCTION public.create_request_from_bot(
  p_cpf TEXT, 
  p_protocol TEXT, 
  p_name TEXT, 
  p_benefit_text TEXT,
  p_whatsapp_jid TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clean_cpf TEXT;
  v_user_id UUID;
  v_full_name TEXT;
  v_benefit_type benefit_type;
  v_benefit_text_lower TEXT;
  v_new_request_id UUID;
BEGIN
  -- Clean CPF
  v_clean_cpf := regexp_replace(p_cpf, '\D', '', 'g');
  
  -- Find user by CPF
  SELECT user_id, full_name INTO v_user_id, v_full_name
  FROM profiles
  WHERE cpf = v_clean_cpf;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'cpf_not_found',
      'message', 'CPF não encontrado no sistema'
    );
  END IF;
  
  -- Map benefit text to benefit_type
  v_benefit_text_lower := lower(trim(p_benefit_text));
  
  CASE v_benefit_text_lower
    WHEN 'farmacia', 'farmácia' THEN v_benefit_type := 'farmacia';
    WHEN 'autoescola', 'auto escola', 'auto-escola' THEN v_benefit_type := 'autoescola';
    WHEN 'oficina' THEN v_benefit_type := 'oficina';
    WHEN 'vale gas', 'vale gás', 'vale_gas' THEN v_benefit_type := 'vale_gas';
    WHEN 'papelaria' THEN v_benefit_type := 'papelaria';
    WHEN 'otica', 'ótica' THEN v_benefit_type := 'otica';
    WHEN 'alteracao ferias', 'alteração férias', 'ferias', 'férias' THEN v_benefit_type := 'alteracao_ferias';
    WHEN 'aviso folga', 'folga', 'falta', 'aviso falta' THEN v_benefit_type := 'aviso_folga_falta';
    WHEN 'atestado' THEN v_benefit_type := 'atestado';
    WHEN 'contracheque', 'holerite' THEN v_benefit_type := 'contracheque';
    WHEN 'abono horas', 'abono de horas' THEN v_benefit_type := 'abono_horas';
    WHEN 'alteracao horario', 'alteração horário', 'horario', 'horário' THEN v_benefit_type := 'alteracao_horario';
    WHEN 'operacao domingo', 'operação domingo', 'domingo' THEN v_benefit_type := 'operacao_domingo';
    WHEN 'relatorio ponto', 'relatório ponto', 'ponto' THEN v_benefit_type := 'relatorio_ponto';
    WHEN 'plano odontologico', 'plano odontológico', 'odontologico', 'odontológico' THEN v_benefit_type := 'plano_odontologico';
    WHEN 'plano saude', 'plano saúde', 'saude', 'saúde' THEN v_benefit_type := 'plano_saude';
    WHEN 'vale transporte', 'vt' THEN v_benefit_type := 'vale_transporte';
    WHEN 'relato anomalia', 'anomalia' THEN v_benefit_type := 'relato_anomalia';
    ELSE v_benefit_type := 'outros';
  END CASE;
  
  -- Insert the benefit request with whatsapp_jid
  INSERT INTO benefit_requests (
    user_id,
    protocol,
    benefit_type,
    status,
    details,
    whatsapp_jid
  ) VALUES (
    v_user_id,
    p_protocol,
    v_benefit_type,
    'aberta',
    'Solicitação criada via WhatsApp Bot. Colaborador: ' || v_full_name,
    p_whatsapp_jid
  )
  RETURNING id INTO v_new_request_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_request_id,
    'user_id', v_user_id,
    'protocol', p_protocol,
    'benefit_type', v_benefit_type::text,
    'collaborator_name', v_full_name,
    'whatsapp_jid', p_whatsapp_jid
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'database_error',
      'message', SQLERRM
    );
END;
$$;