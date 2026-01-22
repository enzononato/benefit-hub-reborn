
CREATE OR REPLACE FUNCTION public.create_request_from_bot(
  p_cpf TEXT,
  p_benefit_type TEXT,
  p_requested_value NUMERIC DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
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
  v_protocol TEXT;
  v_benefit_enum benefit_type;
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
  
  -- Validate and cast benefit type
  BEGIN
    v_benefit_enum := p_benefit_type::benefit_type;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_benefit_type',
      'message', 'Tipo de benefício inválido: ' || p_benefit_type
    );
  END;
  
  -- Generate protocol
  v_protocol := 'BOT-' || to_char(now(), 'YYYYMMDD') || '-' || 
                lpad(floor(random() * 10000)::text, 4, '0');
  
  -- Create the benefit request
  INSERT INTO benefit_requests (
    user_id,
    benefit_type,
    requested_value,
    details,
    protocol,
    status,
    whatsapp_jid,
    account_id,
    conversation_id
  ) VALUES (
    v_user_id,
    v_benefit_enum,
    p_requested_value,
    p_details,
    v_protocol,
    'aberta',
    p_whatsapp_jid,
    p_account_id,
    p_conversation_id
  )
  RETURNING id INTO v_request_id;
  
  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'protocol', v_protocol,
    'user_name', v_full_name,
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
