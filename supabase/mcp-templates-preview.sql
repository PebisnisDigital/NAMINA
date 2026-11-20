begin;
create table public.namina_template_agent_keys(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 label text not null check(char_length(label) between 1 and 80), token_hash text unique not null check(token_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '30 days'), revoked_at timestamptz,
 last_used_at timestamptz, window_at timestamptz not null default now(), window_count integer not null default 0
);
create table public.namina_factory_templates(
 slug text not null check(slug ~ '^[a-z0-9][a-z0-9-]{2,38}[a-z0-9]$'), version integer not null check(version between 1 and 999999),
 owner_id uuid not null references auth.users(id), spec jsonb not null check(jsonb_typeof(spec)='object' and pg_column_size(spec)<=245000),
 status text not null default 'draft' check(status in ('draft','review','published','archived','rejected')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 reviewed_by uuid references auth.users(id), primary key(slug,version)
);
alter table public.namina_template_agent_keys enable row level security;
alter table public.namina_factory_templates enable row level security;
revoke all on public.namina_template_agent_keys,public.namina_factory_templates from public,anon,authenticated;
grant select,insert,update on public.namina_template_agent_keys,public.namina_factory_templates to service_role;
create function public.namina_template_agent_auth(p_hash text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare k public.namina_template_agent_keys%rowtype;
begin
 select x.* into k from public.namina_template_agent_keys x join public.namana_roles r on r.user_id=x.owner_id join public.namana_profiles p on p.user_id=x.owner_id
 where x.token_hash=p_hash and x.revoked_at is null and x.expires_at>now() and r.role='superadmin' and p.status='active' for update of x;
 if not found then return jsonb_build_object('error','unauthorized'); end if;
 if k.window_at>now()-interval '1 minute' and k.window_count>=60 then return jsonb_build_object('error','rate_limit');end if;
 update public.namina_template_agent_keys set last_used_at=now(),window_count=case when window_at<=now()-interval '1 minute' then 1 else window_count+1 end,window_at=case when window_at<=now()-interval '1 minute' then now() else window_at end where id=k.id;
 return jsonb_build_object('id',k.id,'owner_id',k.owner_id);
end;$$;
revoke all on function public.namina_template_agent_auth(text) from public,anon,authenticated;
grant execute on function public.namina_template_agent_auth(text) to service_role;
commit;
