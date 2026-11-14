-- NAMINA Business: one-year default and 100 website limit
-- Applied to Supabase migration 20261114232925; existing expiry dates are not modified.
alter table public.namina_business_workspaces alter column max_sites set default 100;
update public.namina_business_workspaces
  set max_sites = 100, updated_at = now()
  where max_sites <> 100;
alter table public.namina_business_workspaces
  drop constraint namina_business_workspaces_max_sites_check;
alter table public.namina_business_workspaces
  add constraint namina_business_workspaces_max_sites_check
  check (max_sites between 1 and 100);

create or replace function public.namina_business_admin_extend(
  p_workspace_id uuid, p_days integer default 365
) returns timestamptz
language plpgsql security definer set search_path = ''
as $function$
declare v_end timestamptz;
begin
  if auth.uid() is null or not public.namana_is_admin() then
    raise exception 'Akses khusus superadmin' using errcode='42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'Durasi harus 1 sampai 365 hari' using errcode='22023';
  end if;
  update public.namina_business_workspaces
    set current_period_end = greatest(now(), coalesce(current_period_end, now()))
                                + make_interval(days => p_days),
        subscription_status = 'active',
        updated_at = now()
    where id = p_workspace_id
    returning current_period_end into v_end;
  if not found then raise exception 'Mitra tidak ditemukan' using errcode='22023'; end if;
  return v_end;
end $function$;

create or replace function public.namina_business_admin_set_status(p_workspace_id uuid, p_status text)
 returns void
 language plpgsql security definer set search_path = ''
as $function$
begin
  if auth.uid() is null or not public.namana_is_admin() then
    raise exception 'Akses khusus superadmin' using errcode='42501';
  end if;
  if p_status not in ('pending','active','past_due','suspended') then
    raise exception 'Status langganan tidak valid' using errcode='22023';
  end if;
  update public.namina_business_workspaces
    set subscription_status = p_status,
      current_period_end = case when p_status = 'active'
        then now() + interval '365 days'
        when p_status = 'pending' then null
        else current_period_end end,
      updated_at = now()
    where id = p_workspace_id;
  if not found then
    raise exception 'Workspace tidak ditemukan' using errcode='22023';
  end if;
end $function$;
