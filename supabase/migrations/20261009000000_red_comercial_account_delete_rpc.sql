-- Incremental repair for the account registry delete RPC.
create or replace function public.delete_red_comercial_account(p_account_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_account public.represented_company_accounts%rowtype;
begin
  if v_user is null or not public.is_red_comercial_admin() then
    raise exception 'REDCOM_ADMIN_REQUIRED';
  end if;

  select * into v_account
  from public.represented_company_accounts
  where id = p_account_id
  for update;

  if not found then
    raise exception 'REDCOM_ACCOUNT_NOT_FOUND';
  end if;

  if v_account.linked_prospect_id is not null
     or exists (
       select 1
       from public.represented_company_prospects p
       where p.represented_company_id = v_account.represented_company_id
         and p.normalized_company_name = v_account.normalized_account_name
     ) then
    raise exception 'REDCOM_ACCOUNT_HAS_HISTORY';
  end if;

  delete from public.represented_company_accounts
  where id = v_account.id;

  return jsonb_build_object('id', v_account.id, 'deleted', true);
end;
$$;

revoke all on function public.delete_red_comercial_account(uuid) from public;
grant execute on function public.delete_red_comercial_account(uuid) to authenticated;
