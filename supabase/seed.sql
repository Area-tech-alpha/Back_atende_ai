-- Este script popula o banco de dados com dados fakes para desenvolvimento local.
-- Ele é executado automaticamente após as migrações com o comando `npx supabase db reset`.

-- Inserir um login de teste
INSERT INTO public.login_evolution (email, senha, nome_da_instancia, apikey, id_instancia)
VALUES ('dev@email.com', 'sanguenoolho', 'instancia_dev', 'apikey_secreta_123', 'id_instancia_exemplo');

-- Inserir uma configuração de API da Evolution
INSERT INTO public.evolution (url, apikey)
VALUES ('http://localhost:8080', 'apikey_global_evolution');

-- Inserir um assistente de instância de teste
INSERT INTO public.instance_assistants (instance_name, assistant_id, is_active)
VALUES ('instancia_dev', 'asst_abc123def456', true);