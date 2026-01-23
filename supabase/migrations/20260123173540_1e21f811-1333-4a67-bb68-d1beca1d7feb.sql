-- Atualizar a função legada create_request_from_bot para aceitar valores enum no mapeamento
-- e adicionar parâmetros account_id e conversation_id

CREATE OR REPLACE FUNCTION public.create_request_from_bot(
  p_cpf TEXT,
  p_protocol TEXT,
  p_name TEXT DEFAULT NULL,
  p_benefit_text TEXT DEFAULT NULL,
  p_whatsapp_jid TEXT DEFAULT NULL,
  p_account_id BIGINT DEFAULT NULL,
  p_conversation_id BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_full_name TEXT;
  v_status TEXT;
  v_clean_cpf TEXT;
  v_request_id UUID;
  v_benefit_type benefit_type;
  v_lower_text TEXT;
BEGIN
  -- Clean CPF (remove non-numeric characters)
  v_clean_cpf := regexp_replace(p_cpf, '[^0-9]', '', 'g');
  
  -- Find user by CPF (including status)
  SELECT user_id, full_name, status INTO v_user_id, v_full_name, v_status
  FROM profiles
  WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = v_clean_cpf
  LIMIT 1;
  
  -- Check if user exists
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'cpf_not_found',
      'message', 'CPF não encontrado no sistema'
    );
  END IF;
  
  -- Check if collaborator is dismissed
  IF v_status = 'demitido' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'collaborator_dismissed',
      'message', 'Colaborador com status demitido não pode criar solicitações'
    );
  END IF;
  
  -- Normalize benefit text to lowercase for comparison
  v_lower_text := lower(trim(coalesce(p_benefit_text, '')));
  
  -- Map benefit text to benefit_type enum
  -- Includes both legacy text values AND direct enum values
  CASE v_lower_text
    -- Direct enum values (new format)
    WHEN 'autoescola' THEN v_benefit_type := 'autoescola';
    WHEN 'farmacia' THEN v_benefit_type := 'farmacia';
    WHEN 'oficina' THEN v_benefit_type := 'oficina';
    WHEN 'vale_gas' THEN v_benefit_type := 'vale_gas';
    WHEN 'papelaria' THEN v_benefit_type := 'papelaria';
    WHEN 'otica' THEN v_benefit_type := 'otica';
    WHEN 'alteracao_ferias' THEN v_benefit_type := 'alteracao_ferias';
    WHEN 'aviso_folga_falta' THEN v_benefit_type := 'aviso_folga_falta';
    WHEN 'atestado' THEN v_benefit_type := 'atestado';
    WHEN 'contracheque' THEN v_benefit_type := 'contracheque';
    WHEN 'abono_horas' THEN v_benefit_type := 'abono_horas';
    WHEN 'alteracao_horario' THEN v_benefit_type := 'alteracao_horario';
    WHEN 'operacao_domingo' THEN v_benefit_type := 'operacao_domingo';
    WHEN 'relatorio_ponto' THEN v_benefit_type := 'relatorio_ponto';
    WHEN 'plano_odontologico' THEN v_benefit_type := 'plano_odontologico';
    WHEN 'plano_saude' THEN v_benefit_type := 'plano_saude';
    WHEN 'vale_transporte' THEN v_benefit_type := 'vale_transporte';
    WHEN 'relato_anomalia' THEN v_benefit_type := 'relato_anomalia';
    WHEN 'outros' THEN v_benefit_type := 'outros';
    
    -- Legacy text values (old format - kept for backwards compatibility)
    WHEN 'auto escola', 'auto-escola' THEN v_benefit_type := 'autoescola';
    WHEN 'farmácia' THEN v_benefit_type := 'farmacia';
    WHEN 'vale gas', 'vale-gas', 'vale gás', 'vale-gás' THEN v_benefit_type := 'vale_gas';
    WHEN 'ótica' THEN v_benefit_type := 'otica';
    WHEN 'férias', 'ferias', 'alteração de férias', 'alteracao de ferias' THEN v_benefit_type := 'alteracao_ferias';
    WHEN 'folga', 'falta', 'aviso folga', 'aviso falta', 'aviso de folga', 'aviso de falta', 'aviso de folga / falta', 'aviso folga/falta' THEN v_benefit_type := 'aviso_folga_falta';
    WHEN 'abono', 'abono de horas' THEN v_benefit_type := 'abono_horas';
    WHEN 'horário', 'horario', 'alteração de horário', 'alteracao de horario' THEN v_benefit_type := 'alteracao_horario';
    WHEN 'domingo', 'operação domingo' THEN v_benefit_type := 'operacao_domingo';
    WHEN 'ponto', 'relatório de ponto' THEN v_benefit_type := 'relatorio_ponto';
    WHEN 'odonto', 'odontológico', 'odontologico', 'plano odontológico', 'plano odontologico' THEN v_benefit_type := 'plano_odontologico';
    WHEN 'saúde', 'saude', 'plano de saúde', 'plano de saude' THEN v_benefit_type := 'plano_saude';
    WHEN 'transporte', 'vt', 'vale-transporte' THEN v_benefit_type := 'vale_transporte';
    WHEN 'anomalia', 'relato de anomalia' THEN v_benefit_type := 'relato_anomalia';
    
    ELSE v_benefit_type := 'outros';
  END CASE;
  
  -- Check for duplicate protocol
  IF EXISTS (SELECT 1 FROM benefit_requests WHERE protocol = p_protocol) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'duplicate_protocol',
      'message', 'Protocolo já existe: ' || p_protocol
    );
  END IF;
  
  -- Create the benefit request
  INSERT INTO benefit_requests (
    user_id,
    protocol,
    benefit_type,
    status,
    details,
    whatsapp_jid,
    account_id,
    conversation_id
  ) VALUES (
    v_user_id,
    p_protocol,
    v_benefit_type,
    'aberta',
    'Solicitação criada via WhatsApp Bot. Colaborador: ' || v_full_name,
    p_whatsapp_jid,
    p_account_id,
    p_conversation_id
  )
  RETURNING id INTO v_request_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'protocol', p_protocol,
    'user_name', v_full_name,
    'benefit_type', v_benefit_type::text,
    'message', 'Solicitação criada com sucesso'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'internal_error',
    'message', SQLERRM
  );
END;
$$;