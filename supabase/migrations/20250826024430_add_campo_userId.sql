ALTER TABLE public.contato_evolution
ADD COLUMN user_id bigint;

ALTER TABLE public.contato_evolution
ADD CONSTRAINT contato_evolution_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.login_evolution(id) ON DELETE CASCADE;

ALTER TABLE public.mensagem_evolution
ADD COLUMN user_id bigint;

ALTER TABLE public.mensagem_evolution
ADD CONSTRAINT mensagem_evolution_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.login_evolution(id) ON DELETE CASCADE;


ALTER TABLE public.envio_evolution
ADD COLUMN user_id bigint;

ALTER TABLE public.envio_evolution
ADD CONSTRAINT envio_evolution_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.login_evolution(id) ON DELETE CASCADE;

ALTER TABLE public.instance_assistants
ADD COLUMN user_id bigint;

ALTER TABLE public.instance_assistants
ADD CONSTRAINT instance_assistants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.login_evolution(id) ON DELETE CASCADE;