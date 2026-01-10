-- Limpar registros incorretos de 'convenios' e 'beneficios' da tabela user_module_permissions
-- Apenas os módulos individuais devem ser armazenados (autoescola, farmacia, etc.)
DELETE FROM user_module_permissions WHERE module IN ('convenios', 'beneficios');