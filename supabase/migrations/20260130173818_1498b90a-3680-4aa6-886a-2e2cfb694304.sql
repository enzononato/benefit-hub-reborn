-- Atualizar função para bloquear colaboradores de férias
CREATE OR REPLACE FUNCTION public.create_request_from_bot(p_cpf text, p_protocol text DEFAULT NULL::text, p_name text DEFAULT NULL::text, p_benefit_text text DEFAULT 'outros'::text, p_whatsapp_jid text DEFAULT NULL::text, p_account_id bigint DEFAULT NULL::bigint, p_conversation_id bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_full_name TEXT;
  v_request_id UUID;
  v_benefit_type benefit_type;
  v_lower_text TEXT;
  v_final_protocol TEXT;
  v_user_status TEXT;
BEGIN
  -- Normalizar texto para comparação
  v_lower_text := lower(trim(COALESCE(p_benefit_text, 'outros')));

  -- Buscar colaborador pelo CPF
  SELECT p.user_id, p.full_name, p.status
  INTO v_user_id, v_full_name, v_user_status
  FROM profiles p
  WHERE replace(replace(p.cpf, '.', ''), '-', '') = replace(replace(p_cpf, '.', ''), '-', '')
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_not_found',
      'message', 'Colaborador não encontrado com o CPF informado'
    );
  END IF;

  -- Verificar se colaborador está demitido
  IF v_user_status = 'demitido' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_inactive',
      'message', 'Colaborador com status demitido não pode criar solicitações'
    );
  END IF;

  -- Verificar se colaborador está afastado
  IF v_user_status = 'afastado' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_on_leave',
      'message', 'Colaborador afastado não pode criar solicitações'
    );
  END IF;

  -- Verificar se colaborador está de férias
  IF v_user_status = 'ferias' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'user_on_vacation',
      'message', 'Colaborador de férias não pode criar solicitações'
    );
  END IF;

  -- Mapear texto para enum (suporta legado + novos valores)
  CASE v_lower_text
    -- Valores enum diretos
    WHEN 'abono_horas' THEN v_benefit_type := 'abono_horas';
    WHEN 'alteracao_horario' THEN v_benefit_type := 'alteracao_horario';
    WHEN 'alteracao_ferias' THEN v_benefit_type := 'alteracao_ferias';
    WHEN 'atestado' THEN v_benefit_type := 'atestado';
    WHEN 'aviso_folga_falta' THEN v_benefit_type := 'aviso_folga_falta';
    WHEN 'autoescola' THEN v_benefit_type := 'autoescola';
    WHEN 'contracheque' THEN v_benefit_type := 'contracheque';
    WHEN 'farmacia' THEN v_benefit_type := 'farmacia';
    WHEN 'oficina' THEN v_benefit_type := 'oficina';
    WHEN 'vale_gas' THEN v_benefit_type := 'vale_gas';
    WHEN 'papelaria' THEN v_benefit_type := 'papelaria';
    WHEN 'otica' THEN v_benefit_type := 'otica';
    WHEN 'relatorio_ponto' THEN v_benefit_type := 'relatorio_ponto';
    WHEN 'operacao_domingo' THEN v_benefit_type := 'operacao_domingo';
    WHEN 'plano_odontologico' THEN v_benefit_type := 'plano_odontologico';
    WHEN 'plano_saude' THEN v_benefit_type := 'plano_saude';
    WHEN 'vale_transporte' THEN v_benefit_type := 'vale_transporte';
    WHEN 'relato_anomalia' THEN v_benefit_type := 'relato_anomalia';
    WHEN 'plantao_duvidas' THEN v_benefit_type := 'plantao_duvidas';
    WHEN 'outros' THEN v_benefit_type := 'outros';
    
    -- Novos tipos - categoria "Outros"
    WHEN 'listagem_funcionarios' THEN v_benefit_type := 'listagem_funcionarios';
    WHEN 'listagem_aniversariantes' THEN v_benefit_type := 'listagem_aniversariantes';
    WHEN 'listagem_dependentes' THEN v_benefit_type := 'listagem_dependentes';
    WHEN 'listagem_pdcs' THEN v_benefit_type := 'listagem_pdcs';
    WHEN 'informacoes_diversas' THEN v_benefit_type := 'informacoes_diversas';
    
    -- Mapeamentos legados (texto amigável)
    WHEN 'abono de horas', 'abono' THEN v_benefit_type := 'abono_horas';
    WHEN 'alteração de horário', 'alteracao de horario', 'horário', 'horario' THEN v_benefit_type := 'alteracao_horario';
    WHEN 'aviso folga', 'folga', 'falta', 'aviso falta', 'aviso de folga', 'aviso de falta' THEN v_benefit_type := 'aviso_folga_falta';
    WHEN 'relatório de ponto', 'relatorio de ponto', 'ponto' THEN v_benefit_type := 'relatorio_ponto';
    WHEN 'vale gás', 'vale gas', 'gás', 'gas' THEN v_benefit_type := 'vale_gas';
    WHEN 'ótica', 'oculos' THEN v_benefit_type := 'otica';
    WHEN 'farmácia' THEN v_benefit_type := 'farmacia';
    WHEN 'férias', 'ferias', 'alteração de férias' THEN v_benefit_type := 'alteracao_ferias';
    WHEN 'holerite' THEN v_benefit_type := 'contracheque';
    WHEN 'domingo', 'operação domingo' THEN v_benefit_type := 'operacao_domingo';
    WHEN 'odonto', 'odontológico', 'plano odontológico' THEN v_benefit_type := 'plano_odontologico';
    WHEN 'saúde', 'saude', 'plano de saúde' THEN v_benefit_type := 'plano_saude';
    WHEN 'transporte', 'vt' THEN v_benefit_type := 'vale_transporte';
    WHEN 'anomalia' THEN v_benefit_type := 'relato_anomalia';
    WHEN 'plantão de dúvidas', 'plantao de duvidas', 'dúvidas', 'duvidas' THEN v_benefit_type := 'plantao_duvidas';
    
    -- Mapeamentos legados para categoria "Outros"
    WHEN 'listagem de funcionários', 'listagem de funcionarios', 'funcionários', 'funcionarios' THEN v_benefit_type := 'listagem_funcionarios';
    WHEN 'listagem de aniversariantes', 'aniversariantes' THEN v_benefit_type := 'listagem_aniversariantes';
    WHEN 'listagem de dependentes', 'dependentes' THEN v_benefit_type := 'listagem_dependentes';
    WHEN 'listagem de pdcs', 'listagem de pdc', 'pdcs', 'pdc' THEN v_benefit_type := 'listagem_pdcs';
    WHEN 'informações diversas', 'informacoes diversas', 'informações', 'informacoes', 'diversas' THEN v_benefit_type := 'informacoes_diversas';
    
    ELSE v_benefit_type := 'outros';
  END CASE;

  -- Determinar protocolo
  IF p_protocol IS NOT NULL AND p_protocol != '' THEN
    v_final_protocol := p_protocol;
    
    -- Verificar duplicidade
    IF EXISTS (SELECT 1 FROM benefit_requests WHERE protocol = v_final_protocol) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'duplicate_protocol',
        'message', 'Protocolo já existe: ' || v_final_protocol
      );
    END IF;
  ELSE
    -- Gerar protocolo automático
    v_final_protocol := 'BOT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Garantir unicidade
    WHILE EXISTS (SELECT 1 FROM benefit_requests WHERE protocol = v_final_protocol) LOOP
      v_final_protocol := 'BOT-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    END LOOP;
  END IF;

  -- Inserir solicitação
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
    v_final_protocol,
    v_benefit_type,
    'aberta',
    'Solicitação criada via WhatsApp Bot. Colaborador: ' || COALESCE(v_full_name, 'N/A'),
    p_whatsapp_jid,
    p_account_id,
    p_conversation_id
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'protocol', v_final_protocol,
    'benefit_type', v_benefit_type,
    'user_name', v_full_name
  );
END;
$function$;