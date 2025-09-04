-- Remove a constraint antiga
ALTER TABLE public.mensagem_evolution
DROP CONSTRAINT mensagem_evolution_contatos_fkey;

-- Adiciona a nova constraint com a regra ON DELETE SET NULL
ALTER TABLE public.mensagem_evolution
ADD CONSTRAINT mensagem_evolution_contatos_fkey
FOREIGN KEY (contatos) REFERENCES public.contato_evolution(id) ON DELETE SET NULL;


-- Remove a constraint antiga
ALTER TABLE public.envio_evolution
DROP CONSTRAINT envio_evolution_id_mensagem_fkey1;

-- Adiciona a nova constraint com a regra ON DELETE CASCADE
ALTER TABLE public.envio_evolution
ADD CONSTRAINT envio_evolution_id_mensagem_fkey1
FOREIGN KEY (id_mensagem) REFERENCES public.mensagem_evolution(id) ON DELETE CASCADE;