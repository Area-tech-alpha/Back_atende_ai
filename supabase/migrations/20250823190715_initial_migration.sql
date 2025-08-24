
  create table "public"."baileys_auth_store" (
    "id" text not null,
    "session_data" jsonb not null
      );



  create table "public"."contato_evolution" (
    "id" bigint generated always as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "contatos" text,
    "relacao_login" bigint,
    "name" text
      );



  create table "public"."envio_evolution" (
    "id" integer generated always as identity not null,
    "id_mensagem" bigint,
    "contato" character varying,
    "status" character varying,
    "data_envio" timestamp without time zone default now(),
    "erro" text
      );



  create table "public"."evolution" (
    "id" bigint generated always as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "url" text,
    "apikey" text
      );



  create table "public"."instance_assistants" (
    "id" integer generated always as identity not null,
    "instance_name" text not null,
    "assistant_id" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."login_evolution" (
    "id" bigint generated always as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "email" text,
    "senha" text,
    "nome_da_instancia" text,
    "apikey" text,
    "id_instancia" text
      );



  create table "public"."mensagem_evolution" (
    "id" bigint generated always as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "texto" text,
    "imagem" text,
    "data_de_envio" timestamp with time zone,
    "contatos" bigint,
    "name" text,
    "delay" numeric,
    "status" character varying,
    "evolution_id" bigint,
    "nome_da_instancia" text,
    "apikey_da_instancia" text,
    "device_id" text
      );



  create table "public"."webhook_messages" (
    "id" uuid not null default gen_random_uuid(),
    "event" text not null,
    "instance" text not null,
    "message_id" text not null,
    "remote_jid" text not null,
    "from_me" boolean not null,
    "participant" text,
    "push_name" text,
    "status" text,
    "message_type" text,
    "message_content" text,
    "message_timestamp" bigint,
    "instance_id" uuid,
    "source" text,
    "server_url" text,
    "date_time" timestamp with time zone,
    "sender" text,
    "apikey" text,
    "created_at" timestamp with time zone default now(),
    "responded" boolean default false
      );


CREATE UNIQUE INDEX baileys_auth_store_pkey ON public.baileys_auth_store USING btree (id);

CREATE UNIQUE INDEX contato_evolution_pkey ON public.contato_evolution USING btree (id);

CREATE UNIQUE INDEX envio_evolution_pkey ON public.envio_evolution USING btree (id);

CREATE UNIQUE INDEX evolution_pkey ON public.evolution USING btree (id);

CREATE UNIQUE INDEX instance_assistants_pkey ON public.instance_assistants USING btree (id);

CREATE UNIQUE INDEX login_evolution_pkey ON public.login_evolution USING btree (id);

CREATE UNIQUE INDEX mensagem_evolution_pkey ON public.mensagem_evolution USING btree (id);

CREATE UNIQUE INDEX webhook_messages_message_id_key ON public.webhook_messages USING btree (message_id);

CREATE UNIQUE INDEX webhook_messages_pkey ON public.webhook_messages USING btree (id);

alter table "public"."baileys_auth_store" add constraint "baileys_auth_store_pkey" PRIMARY KEY using index "baileys_auth_store_pkey";

alter table "public"."contato_evolution" add constraint "contato_evolution_pkey" PRIMARY KEY using index "contato_evolution_pkey";

alter table "public"."envio_evolution" add constraint "envio_evolution_pkey" PRIMARY KEY using index "envio_evolution_pkey";

alter table "public"."evolution" add constraint "evolution_pkey" PRIMARY KEY using index "evolution_pkey";

alter table "public"."instance_assistants" add constraint "instance_assistants_pkey" PRIMARY KEY using index "instance_assistants_pkey";

alter table "public"."login_evolution" add constraint "login_evolution_pkey" PRIMARY KEY using index "login_evolution_pkey";

alter table "public"."mensagem_evolution" add constraint "mensagem_evolution_pkey" PRIMARY KEY using index "mensagem_evolution_pkey";

alter table "public"."webhook_messages" add constraint "webhook_messages_pkey" PRIMARY KEY using index "webhook_messages_pkey";

alter table "public"."contato_evolution" add constraint "contato_evolution_relacao_login_fkey" FOREIGN KEY (relacao_login) REFERENCES login_evolution(id) not valid;

alter table "public"."contato_evolution" validate constraint "contato_evolution_relacao_login_fkey";

alter table "public"."envio_evolution" add constraint "envio_evolution_id_mensagem_fkey1" FOREIGN KEY (id_mensagem) REFERENCES mensagem_evolution(id) not valid;

alter table "public"."envio_evolution" validate constraint "envio_evolution_id_mensagem_fkey1";

alter table "public"."mensagem_evolution" add constraint "mensagem_evolution_contatos_fkey" FOREIGN KEY (contatos) REFERENCES contato_evolution(id) not valid;

alter table "public"."mensagem_evolution" validate constraint "mensagem_evolution_contatos_fkey";

alter table "public"."mensagem_evolution" add constraint "mensagem_evolution_evolution_id_fkey" FOREIGN KEY (evolution_id) REFERENCES evolution(id) not valid;

alter table "public"."mensagem_evolution" validate constraint "mensagem_evolution_evolution_id_fkey";

alter table "public"."webhook_messages" add constraint "webhook_messages_message_id_key" UNIQUE using index "webhook_messages_message_id_key";

grant delete on table "public"."baileys_auth_store" to "anon";

grant insert on table "public"."baileys_auth_store" to "anon";

grant references on table "public"."baileys_auth_store" to "anon";

grant select on table "public"."baileys_auth_store" to "anon";

grant trigger on table "public"."baileys_auth_store" to "anon";

grant truncate on table "public"."baileys_auth_store" to "anon";

grant update on table "public"."baileys_auth_store" to "anon";

grant delete on table "public"."baileys_auth_store" to "authenticated";

grant insert on table "public"."baileys_auth_store" to "authenticated";

grant references on table "public"."baileys_auth_store" to "authenticated";

grant select on table "public"."baileys_auth_store" to "authenticated";

grant trigger on table "public"."baileys_auth_store" to "authenticated";

grant truncate on table "public"."baileys_auth_store" to "authenticated";

grant update on table "public"."baileys_auth_store" to "authenticated";

grant delete on table "public"."baileys_auth_store" to "service_role";

grant insert on table "public"."baileys_auth_store" to "service_role";

grant references on table "public"."baileys_auth_store" to "service_role";

grant select on table "public"."baileys_auth_store" to "service_role";

grant trigger on table "public"."baileys_auth_store" to "service_role";

grant truncate on table "public"."baileys_auth_store" to "service_role";

grant update on table "public"."baileys_auth_store" to "service_role";

grant delete on table "public"."contato_evolution" to "anon";

grant insert on table "public"."contato_evolution" to "anon";

grant references on table "public"."contato_evolution" to "anon";

grant select on table "public"."contato_evolution" to "anon";

grant trigger on table "public"."contato_evolution" to "anon";

grant truncate on table "public"."contato_evolution" to "anon";

grant update on table "public"."contato_evolution" to "anon";

grant delete on table "public"."contato_evolution" to "authenticated";

grant insert on table "public"."contato_evolution" to "authenticated";

grant references on table "public"."contato_evolution" to "authenticated";

grant select on table "public"."contato_evolution" to "authenticated";

grant trigger on table "public"."contato_evolution" to "authenticated";

grant truncate on table "public"."contato_evolution" to "authenticated";

grant update on table "public"."contato_evolution" to "authenticated";

grant delete on table "public"."contato_evolution" to "service_role";

grant insert on table "public"."contato_evolution" to "service_role";

grant references on table "public"."contato_evolution" to "service_role";

grant select on table "public"."contato_evolution" to "service_role";

grant trigger on table "public"."contato_evolution" to "service_role";

grant truncate on table "public"."contato_evolution" to "service_role";

grant update on table "public"."contato_evolution" to "service_role";

grant delete on table "public"."envio_evolution" to "anon";

grant insert on table "public"."envio_evolution" to "anon";

grant references on table "public"."envio_evolution" to "anon";

grant select on table "public"."envio_evolution" to "anon";

grant trigger on table "public"."envio_evolution" to "anon";

grant truncate on table "public"."envio_evolution" to "anon";

grant update on table "public"."envio_evolution" to "anon";

grant delete on table "public"."envio_evolution" to "authenticated";

grant insert on table "public"."envio_evolution" to "authenticated";

grant references on table "public"."envio_evolution" to "authenticated";

grant select on table "public"."envio_evolution" to "authenticated";

grant trigger on table "public"."envio_evolution" to "authenticated";

grant truncate on table "public"."envio_evolution" to "authenticated";

grant update on table "public"."envio_evolution" to "authenticated";

grant delete on table "public"."envio_evolution" to "service_role";

grant insert on table "public"."envio_evolution" to "service_role";

grant references on table "public"."envio_evolution" to "service_role";

grant select on table "public"."envio_evolution" to "service_role";

grant trigger on table "public"."envio_evolution" to "service_role";

grant truncate on table "public"."envio_evolution" to "service_role";

grant update on table "public"."envio_evolution" to "service_role";

grant delete on table "public"."evolution" to "anon";

grant insert on table "public"."evolution" to "anon";

grant references on table "public"."evolution" to "anon";

grant select on table "public"."evolution" to "anon";

grant trigger on table "public"."evolution" to "anon";

grant truncate on table "public"."evolution" to "anon";

grant update on table "public"."evolution" to "anon";

grant delete on table "public"."evolution" to "authenticated";

grant insert on table "public"."evolution" to "authenticated";

grant references on table "public"."evolution" to "authenticated";

grant select on table "public"."evolution" to "authenticated";

grant trigger on table "public"."evolution" to "authenticated";

grant truncate on table "public"."evolution" to "authenticated";

grant update on table "public"."evolution" to "authenticated";

grant delete on table "public"."evolution" to "service_role";

grant insert on table "public"."evolution" to "service_role";

grant references on table "public"."evolution" to "service_role";

grant select on table "public"."evolution" to "service_role";

grant trigger on table "public"."evolution" to "service_role";

grant truncate on table "public"."evolution" to "service_role";

grant update on table "public"."evolution" to "service_role";

grant delete on table "public"."instance_assistants" to "anon";

grant insert on table "public"."instance_assistants" to "anon";

grant references on table "public"."instance_assistants" to "anon";

grant select on table "public"."instance_assistants" to "anon";

grant trigger on table "public"."instance_assistants" to "anon";

grant truncate on table "public"."instance_assistants" to "anon";

grant update on table "public"."instance_assistants" to "anon";

grant delete on table "public"."instance_assistants" to "authenticated";

grant insert on table "public"."instance_assistants" to "authenticated";

grant references on table "public"."instance_assistants" to "authenticated";

grant select on table "public"."instance_assistants" to "authenticated";

grant trigger on table "public"."instance_assistants" to "authenticated";

grant truncate on table "public"."instance_assistants" to "authenticated";

grant update on table "public"."instance_assistants" to "authenticated";

grant delete on table "public"."instance_assistants" to "service_role";

grant insert on table "public"."instance_assistants" to "service_role";

grant references on table "public"."instance_assistants" to "service_role";

grant select on table "public"."instance_assistants" to "service_role";

grant trigger on table "public"."instance_assistants" to "service_role";

grant truncate on table "public"."instance_assistants" to "service_role";

grant update on table "public"."instance_assistants" to "service_role";

grant delete on table "public"."login_evolution" to "anon";

grant insert on table "public"."login_evolution" to "anon";

grant references on table "public"."login_evolution" to "anon";

grant select on table "public"."login_evolution" to "anon";

grant trigger on table "public"."login_evolution" to "anon";

grant truncate on table "public"."login_evolution" to "anon";

grant update on table "public"."login_evolution" to "anon";

grant delete on table "public"."login_evolution" to "authenticated";

grant insert on table "public"."login_evolution" to "authenticated";

grant references on table "public"."login_evolution" to "authenticated";

grant select on table "public"."login_evolution" to "authenticated";

grant trigger on table "public"."login_evolution" to "authenticated";

grant truncate on table "public"."login_evolution" to "authenticated";

grant update on table "public"."login_evolution" to "authenticated";

grant delete on table "public"."login_evolution" to "service_role";

grant insert on table "public"."login_evolution" to "service_role";

grant references on table "public"."login_evolution" to "service_role";

grant select on table "public"."login_evolution" to "service_role";

grant trigger on table "public"."login_evolution" to "service_role";

grant truncate on table "public"."login_evolution" to "service_role";

grant update on table "public"."login_evolution" to "service_role";

grant delete on table "public"."mensagem_evolution" to "anon";

grant insert on table "public"."mensagem_evolution" to "anon";

grant references on table "public"."mensagem_evolution" to "anon";

grant select on table "public"."mensagem_evolution" to "anon";

grant trigger on table "public"."mensagem_evolution" to "anon";

grant truncate on table "public"."mensagem_evolution" to "anon";

grant update on table "public"."mensagem_evolution" to "anon";

grant delete on table "public"."mensagem_evolution" to "authenticated";

grant insert on table "public"."mensagem_evolution" to "authenticated";

grant references on table "public"."mensagem_evolution" to "authenticated";

grant select on table "public"."mensagem_evolution" to "authenticated";

grant trigger on table "public"."mensagem_evolution" to "authenticated";

grant truncate on table "public"."mensagem_evolution" to "authenticated";

grant update on table "public"."mensagem_evolution" to "authenticated";

grant delete on table "public"."mensagem_evolution" to "service_role";

grant insert on table "public"."mensagem_evolution" to "service_role";

grant references on table "public"."mensagem_evolution" to "service_role";

grant select on table "public"."mensagem_evolution" to "service_role";

grant trigger on table "public"."mensagem_evolution" to "service_role";

grant truncate on table "public"."mensagem_evolution" to "service_role";

grant update on table "public"."mensagem_evolution" to "service_role";

grant delete on table "public"."webhook_messages" to "anon";

grant insert on table "public"."webhook_messages" to "anon";

grant references on table "public"."webhook_messages" to "anon";

grant select on table "public"."webhook_messages" to "anon";

grant trigger on table "public"."webhook_messages" to "anon";

grant truncate on table "public"."webhook_messages" to "anon";

grant update on table "public"."webhook_messages" to "anon";

grant delete on table "public"."webhook_messages" to "authenticated";

grant insert on table "public"."webhook_messages" to "authenticated";

grant references on table "public"."webhook_messages" to "authenticated";

grant select on table "public"."webhook_messages" to "authenticated";

grant trigger on table "public"."webhook_messages" to "authenticated";

grant truncate on table "public"."webhook_messages" to "authenticated";

grant update on table "public"."webhook_messages" to "authenticated";

grant delete on table "public"."webhook_messages" to "service_role";

grant insert on table "public"."webhook_messages" to "service_role";

grant references on table "public"."webhook_messages" to "service_role";

grant select on table "public"."webhook_messages" to "service_role";

grant trigger on table "public"."webhook_messages" to "service_role";

grant truncate on table "public"."webhook_messages" to "service_role";

grant update on table "public"."webhook_messages" to "service_role";


