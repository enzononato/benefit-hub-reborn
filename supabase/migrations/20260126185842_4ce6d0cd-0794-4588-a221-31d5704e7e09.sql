-- Inserir configurações de SLA para todos os tipos que faltam
INSERT INTO sla_configs (benefit_type, green_hours, yellow_hours, time_unit) VALUES
  ('alteracao_ferias', 48, 72, 'hours'),
  ('aviso_folga_falta', 24, 48, 'hours'),
  ('atestado', 24, 48, 'hours'),
  ('contracheque', 24, 48, 'hours'),
  ('abono_horas', 24, 48, 'hours'),
  ('alteracao_horario', 24, 48, 'hours'),
  ('operacao_domingo', 24, 48, 'hours'),
  ('relatorio_ponto', 24, 48, 'hours'),
  ('plano_odontologico', 48, 72, 'hours'),
  ('plano_saude', 48, 72, 'hours'),
  ('vale_transporte', 24, 48, 'hours'),
  ('relato_anomalia', 24, 48, 'hours'),
  ('listagem_funcionarios', 24, 48, 'hours'),
  ('listagem_aniversariantes', 24, 48, 'hours'),
  ('listagem_dependentes', 24, 48, 'hours'),
  ('listagem_pdcs', 24, 48, 'hours'),
  ('informacoes_diversas', 24, 48, 'hours'),
  ('plantao_duvidas', 24, 48, 'hours')
ON CONFLICT (benefit_type) DO NOTHING;