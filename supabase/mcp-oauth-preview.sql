-- Apply only after mcp-preview.sql on an isolated staging database.
begin;
create table public.namina_mcp_oauth_codes (
  code_hash text primary key check(code_hash ~ '^[a-f0-9]{64}$'),
  workspace_id uuid not null references public.namina_business_workspaces(id) on delete cascade,
  owner_id uuid not null,
  access_generation timestamptz not null,
  client_id text not null,
  redirect_uri text not null,
  resource text not null check(resource='https://namina.biz.id/api/mcp'),
  challenge text not null check(challenge ~ '^[A-Za-z0-9_-]{43}$'),
  scope text not null check(scope in ('read','draft')),
  label text not null,
  expires_at timestamptz not null default(now()+interval '5 minutes')
);
alter table public.namina_mcp_oauth_codes enable row level security;
revoke all on public.namina_mcp_oauth_codes from public,anon,authenticated;
grant select,insert,delete on public.namina_mcp_oauth_codes to service_role;
create index namina_mcp_oauth_codes_expiration on public.namina_mcp_oauth_codes(expires_at);
create function public.namina_mcp_issue_code(
 p_owner uuid,p_workspace uuid,p_generation timestamptz,p_code_hash text,p_client text,p_redirect text,
 p_resource text,p_challenge text,p_scope text,p_label text
) returns boolean language plpgsql security invoker set search_path='' as $$
begin
  perform 1 from public.namina_business_workspaces w join public.namina_business_access_keys a on a.workspace_id=w.id
   where w.id=p_workspace and w.owner_id=p_owner and w.subscription_status<>'suspended'
   and a.revoked_at is null and a.rotated_at=p_generation for update of w for share of a;
  if not found then return false; end if;
  delete from public.namina_mcp_oauth_codes where expires_at<=now();
  if (select count(*) from public.namina_mcp_oauth_codes where workspace_id=p_workspace)>=10 then return false; end if;
  insert into public.namina_mcp_oauth_codes(code_hash,workspace_id,owner_id,access_generation,client_id,redirect_uri,resource,challenge,scope,label)
  values(p_code_hash,p_workspace,p_owner,p_generation,p_client,p_redirect,p_resource,p_challenge,p_scope,p_label);
  return true;
end; $$;
revoke all on function public.namina_mcp_issue_code(uuid,uuid,timestamptz,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.namina_mcp_issue_code(uuid,uuid,timestamptz,text,text,text,text,text,text,text) to service_role;

create function public.namina_mcp_exchange_code(
 p_code_hash text,p_client text,p_redirect text,p_resource text,p_challenge text,p_token_hash text
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.namina_mcp_oauth_codes%rowtype; r jsonb;
begin
  -- Acquire workspace lock before consuming a code, matching the issuance lock order.
  select * into c from public.namina_mcp_oauth_codes where code_hash=p_code_hash;
  if not found then return jsonb_build_object('error','invalid_grant'); end if;
  perform 1 from public.namina_business_workspaces where id=c.workspace_id for update;
  if not found then return jsonb_build_object('error','invalid_grant'); end if;
  delete from public.namina_mcp_oauth_codes
    where code_hash=p_code_hash and client_id=p_client and redirect_uri=p_redirect and resource=p_resource
      and challenge=p_challenge and expires_at>now() returning * into c;
  if not found then return jsonb_build_object('error','invalid_grant'); end if;
  r:=public.namina_mcp_manage(c.owner_id,c.workspace_id,c.access_generation,'create',null,c.label,c.scope,p_token_hash);
  if r ? 'error' then return jsonb_build_object('error','invalid_grant'); end if;
  return jsonb_build_object('scope',c.scope);
end; $$;
revoke all on function public.namina_mcp_exchange_code(text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.namina_mcp_exchange_code(text,text,text,text,text,text) to service_role;
commit;
