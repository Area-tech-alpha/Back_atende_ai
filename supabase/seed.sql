-- Este script popula o banco de dados com dados fakes para desenvolvimento local.
-- Ele é executado automaticamente após as migrações com o comando `npx supabase db reset`.

-- Inserir um login de teste
INSERT INTO public.login_evolution (email, senha, nome_da_instancia, apikey, id_instancia)
VALUES ('dev@email.com', '$argon2id$v=19$m=65536,t=3,p=4$by/LcN2zyosA9mJBT2ZIug$eoLYnj/eLe6197FJC0M3XVQ3SUSFsEspU6B4Lu9Rvzs', 'instancia_dev', 'apikey_secreta_123', 'id_instancia_exemplo');

-- Inserir uma configuração de API da Evolution
INSERT INTO public.evolution (url, apikey)
VALUES ('http://localhost:8080', 'apikey_global_evolution');

-- Inserir um grupo de contatos associado ao login de teste
-- O JSON precisa estar em uma única linha ou ser um JSON válido.
INSERT INTO public.contato_evolution (name, relacao_login, contatos)
VALUES ('Contatos de Teste', 1, '[{"name": "Contato Teste 1", "phone": "5511999999999"}, {"name": "Contato Teste 2", "phone": "5521988888888"}]');

-- Inserir um assistente de instância de teste
INSERT INTO public.instance_assistants (instance_name, assistant_id, is_active)
VALUES ('instancia_dev', 'asst_abc123def456', true);