-- Inserir papéis para os usuários que estão sem papel definido
-- projetos.ti@revalle.com.br -> admin (usuário principal de TI)
INSERT INTO public.user_roles (user_id, role)
VALUES ('de6093c7-7b78-4d6c-848f-38666fa136d6', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- dp3@revalle.com.br -> agente_dp
INSERT INTO public.user_roles (user_id, role)
VALUES ('abee28f1-a5b6-4f26-94dd-03f8341f09d2', 'agente_dp')
ON CONFLICT (user_id, role) DO NOTHING;

-- aprendizdp@revalle.com.br -> agente_dp
INSERT INTO public.user_roles (user_id, role)
VALUES ('106ba77e-1e8f-4a2f-ad60-ff7e8f743b3e', 'agente_dp')
ON CONFLICT (user_id, role) DO NOTHING;

-- ti2@revalle.com.br -> gestor
INSERT INTO public.user_roles (user_id, role)
VALUES ('f2a43dbc-f987-4b80-b21a-b62587ea7d2f', 'gestor')
ON CONFLICT (user_id, role) DO NOTHING;