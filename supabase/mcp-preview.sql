-- Review and test on staging before generating a production migration.
begin;
create table public.namina_mcp_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.namina_business_workspaces(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  scope text not null check (scope in ('read','draft')),
  access_generation timestamptz not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  last_used_at timestamptz,
  window_at timestamptz not null default now(),
  window_count integer not null default 0
);
create index namina_mcp_keys_workspace on public.namina_mcp_keys(workspace_id);
alter table public.namina_mcp_keys enable row level security;
revoke all on public.namina_mcp_keys from public, anon, authenticated;
grant select, insert, update on public.namina_mcp_keys to service_role;

-- Only the same-origin server route calls this after validating the Studio session.
create function public.namina_mcp_manage(
  p_owner uuid, p_workspace uuid, p_generation timestamptz,
  p_action text, p_id uuid default null, p_label text default null,
  p_scope text default null, p_hash text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_result jsonb;
begin
  perform 1 from public.namina_business_workspaces w
    join public.namina_business_access_keys a on a.workspace_id=w.id
    where w.id=p_workspace and w.owner_id=p_owner
      and w.subscription_status <> 'suspended'
      and a.revoked_at is null and a.rotated_at=p_generation
    for update of w for share of a;
  if not found then return jsonb_build_object('error','workspace_unavailable'); end if;
  if p_action='list' then
    select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'label',m.label,'scope',m.scope,
      'created_at',m.created_at,'expires_at',m.expires_at,'last_used_at',m.last_used_at,
      'revoked_at',m.revoked_at,'active',m.revoked_at is null and m.expires_at>now()
      and m.access_generation=p_generation) order by m.created_at desc),'[]'::jsonb)
      into v_result from public.namina_mcp_keys m where m.workspace_id=p_workspace;
    return jsonb_build_object('keys',v_result);
  elsif p_action='create' then
    if (select count(*) from public.namina_mcp_keys where workspace_id=p_workspace
      and revoked_at is null and expires_at>now() and access_generation=p_generation)>=10
      then return jsonb_build_object('error','key_limit'); end if;
    insert into public.namina_mcp_keys(workspace_id,label,scope,token_hash,access_generation)
      values(p_workspace,p_label,p_scope,p_hash,p_generation)
      returning jsonb_build_object('id',id,'label',label,'scope',scope,'expires_at',expires_at) into v_result;
    return jsonb_build_object('key',v_result);
  elsif p_action='revoke' then
    update public.namina_mcp_keys set revoked_at=coalesce(revoked_at,now())
      where workspace_id=p_workspace and id=p_id returning jsonb_build_object('id',id) into v_result;
    return coalesce(v_result,jsonb_build_object('error','key_unavailable'));
  end if;
  return jsonb_build_object('error','invalid_action');
end; $$;
revoke all on function public.namina_mcp_manage(uuid,uuid,timestamptz,text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.namina_mcp_manage(uuid,uuid,timestamptz,text,uuid,text,text,text) to service_role;

-- Key lookup, permission, workspace isolation, and operation share one transaction.
create function public.namina_mcp_operation(
  p_hash text, p_action text, p_id uuid default null,
  p_document jsonb default null, p_updated_at timestamptz default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_key public.namina_mcp_keys%rowtype; v_result jsonb; v_workspace uuid;
begin
  select workspace_id into v_workspace from public.namina_mcp_keys where token_hash=p_hash;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  perform 1 from public.namina_business_workspaces where id=v_workspace and subscription_status <> 'suspended' for update;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  select m.* into v_key from public.namina_mcp_keys m
    join public.namina_business_access_keys a on a.workspace_id=m.workspace_id
    where m.token_hash=p_hash and m.workspace_id=v_workspace
      and m.revoked_at is null and m.expires_at>now()
      and a.revoked_at is null and a.rotated_at=m.access_generation
    for update of m for share of a;
  if not found then return jsonb_build_object('error','unauthorized'); end if;
  if v_key.window_at>now()-interval '1 minute' and v_key.window_count>=60 then
    return jsonb_build_object('error','rate_limit');
  end if;
  update public.namina_mcp_keys set last_used_at=now(),
    window_count=case when window_at<=now()-interval '1 minute' then 1 else window_count+1 end,
    window_at=case when window_at<=now()-interval '1 minute' then now() else window_at end
    where id=v_key.id;
  if p_action='authorize' then return jsonb_build_object('scope',v_key.scope); end if;
  if p_action='list' then
    select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into v_result from (
      select id,slug,updated_at,published_sha from public.namina_business_sites
      where workspace_id=v_workspace order by updated_at desc limit 100
    ) s;
  elsif p_action='get' then
    select jsonb_build_object('id',id,'slug',slug,'document',document,'updated_at',updated_at,'published_sha',published_sha)
      into v_result from public.namina_business_sites where workspace_id=v_workspace and id=p_id;
  elsif p_action in ('update','create') then
    if v_key.scope<>'draft' then return jsonb_build_object('error','forbidden'); end if;
    if jsonb_typeof(p_document) is distinct from 'object' or pg_column_size(p_document)>250000
      or jsonb_typeof(p_document->'content') is distinct from 'object'
      or jsonb_typeof(p_document->'media') is distinct from 'object'
      or coalesce(p_document->>'slug','') !~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'
      then return jsonb_build_object('error','invalid_document'); end if;
    if p_action='update' then
      update public.namina_business_sites set document=p_document,updated_at=clock_timestamp()
        where workspace_id=v_workspace and id=p_id and slug=p_document->>'slug' and updated_at=p_updated_at
        returning jsonb_build_object('id',id,'slug',slug,'updated_at',updated_at) into v_result;
    else
      -- Existing quota/slug triggers enforce subscription and reservation rules.
      begin
        insert into public.namina_business_sites(workspace_id,slug,document)
          values(v_workspace,p_document->>'slug',p_document)
          returning jsonb_build_object('id',id,'slug',slug,'updated_at',updated_at) into v_result;
      exception when unique_violation or check_violation or raise_exception then
        return jsonb_build_object('error','creation_rejected');
      end;
    end if;
  else return jsonb_build_object('error','invalid_action'); end if;
  return case when v_result is null then jsonb_build_object('error','site_unavailable_or_changed')
    else jsonb_build_object('data',v_result) end;
end; $$;
revoke all on function public.namina_mcp_operation(text,text,uuid,jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.namina_mcp_operation(text,text,uuid,jsonb,timestamptz) to service_role;
commit;
