begin;
create table public.namina_admin_mcp_keys (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 label text not null check(char_length(label) between 1 and 80),
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 scope text not null check(scope in ('websites','partners','both')),
 created_at timestamptz not null default now(), expires_at timestamptz not null default(now()+interval '30 days'),
 revoked_at timestamptz, last_used_at timestamptz, window_at timestamptz not null default now(), window_count integer not null default 0
);
create table public.namina_admin_mcp_drafts (
 slug text primary key check(slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
 document jsonb not null check(jsonb_typeof(document)='object' and document->>'slug'=slug and pg_column_size(document)<=250000),
 base_sha text, updated_at timestamptz not null default now(), updated_by uuid references public.namina_admin_mcp_keys(id) on delete set null
);
create table public.namina_admin_mcp_requests (
 id uuid primary key default gen_random_uuid(), key_id uuid references public.namina_admin_mcp_keys(id) on delete set null,
 owner_id uuid not null references auth.users(id) on delete cascade,
 operation text not null check(operation in ('publish','create_partner','edit_partner','extend_partner','rotate_link','revoke_link','revoke_partner_mcp','set_partner_quota')),
 payload jsonb not null check(jsonb_typeof(payload)='object' and pg_column_size(payload)<=250000),
 status text not null default 'pending' check(status in ('pending','running','completed','failed','rejected')),
 created_at timestamptz not null default now(), decision_at timestamptz, approved_by uuid references auth.users(id) on delete set null,
 result jsonb
);
create index namina_admin_mcp_requests_owner_idx on public.namina_admin_mcp_requests(owner_id,status,created_at desc);
create index namina_admin_mcp_keys_owner_idx on public.namina_admin_mcp_keys(owner_id);
alter table public.namina_admin_mcp_keys enable row level security;
alter table public.namina_admin_mcp_drafts enable row level security;
alter table public.namina_admin_mcp_requests enable row level security;
revoke all on public.namina_admin_mcp_keys,public.namina_admin_mcp_drafts,public.namina_admin_mcp_requests from public,anon,authenticated;
grant select,insert,update on public.namina_admin_mcp_keys,public.namina_admin_mcp_drafts,public.namina_admin_mcp_requests to service_role;
create function public.namina_admin_mcp_auth(p_hash text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare k public.namina_admin_mcp_keys%rowtype;
begin
 select x.* into k from public.namina_admin_mcp_keys x
 join public.namana_roles r on r.user_id=x.owner_id
 join public.namana_profiles p on p.user_id=x.owner_id
 where x.token_hash=p_hash and x.revoked_at is null and x.expires_at>now()
 and r.role='superadmin' and p.status='active' for update of x;
 if not found then return jsonb_build_object('error','unauthorized'); end if;
 if k.window_at>now()-interval '1 minute' and k.window_count>=60 then return jsonb_build_object('error','rate_limit'); end if;
 update public.namina_admin_mcp_keys set last_used_at=now(),
 window_count=case when window_at<=now()-interval '1 minute' then 1 else window_count+1 end,
 window_at=case when window_at<=now()-interval '1 minute' then now() else window_at end where id=k.id;
 return jsonb_build_object('id',k.id,'owner_id',k.owner_id,'scope',k.scope);
end; $$;
revoke all on function public.namina_admin_mcp_auth(text) from public,anon,authenticated;
grant execute on function public.namina_admin_mcp_auth(text) to service_role;
commit;
