import { describe, expect, test } from 'vitest'
import migration from '../../supabase/migrations/20261008000000_red_comercial_accounts_and_portfolio.sql?raw'
import deleteMigration from '../../supabase/migrations/20261009000000_red_comercial_account_delete_rpc.sql?raw'
import component from './components/CompanyAccountsPanel.tsx?raw'
import repository from '../repositories/supabase-admin-repository.ts?raw'

describe('red comercial accounts and portfolio', () => {
  test('defines protected account states and normalized uniqueness', () => {
    expect(migration).toContain('create table public.represented_company_accounts')
    expect(migration).toContain("'represented_client'")
    expect(migration).toContain("'represented_active_opportunity'")
    expect(migration).toContain("'represented_lead'")
    expect(migration).toContain("'arista_prospect'")
    expect(migration).toContain('represented_company_accounts_company_name_unique_idx')
    expect(migration).toContain('normalized_account_name')
    expect(migration).toContain('red_comercial_normalize_company_name(v_name)')
    expect(migration).toContain('language sql immutable')
    expect(migration).toContain('select btrim(regexp_replace(')
    expect(migration).toContain('red_comercial_validate_account_prospect_company')
  })

  test('keeps account reads sanitized and prospect creation server-side', () => {
    expect(migration).toContain("'public_note', a.public_note")
    expect(migration).not.toContain("'internal_note', a.internal_note")
    expect(migration).toContain('check_red_comercial_account_contactability')
    expect(migration).toContain('REDCOM_ACCOUNT_CLIENT_BLOCKED')
    expect(migration).toContain('REDCOM_ACCOUNT_ACTIVE_OPPORTUNITY_BLOCKED')
    expect(migration).toContain('REDCOM_ACCOUNT_BLOCKED')
    expect(migration).toContain('create or replace function public.create_red_comercial_prospect')
    expect(migration).toContain("'has_linked_prospect', a.linked_prospect_id is not null")
    expect(migration).not.toContain("'linked_prospect_id', a.linked_prospect_id,\n      'created_at'")
  })

  test('supports idempotent admin import and lead linkage', () => {
    expect(migration).toContain('import_red_comercial_company_accounts')
    expect(migration).toContain('on conflict (represented_company_id, normalized_account_name) do nothing')
    expect(migration).toContain("p_status = 'represented_lead'")
    expect(migration).toContain('linked_prospect_id')
    expect(migration).toContain("'skipped_existing'")
    expect(migration).toContain("'result','conflict'")
    expect(migration).toContain("'message','La cuenta ya existe con otro estado.")
  })

  test('blocks new commercial actions and assignments for protected accounts', () => {
    expect(migration).toContain('red_comercial_assert_prospect_contactable')
    expect(migration).toContain('represented_company_prospects_guard_account_assignment')
    expect(migration).toContain('represented_company_prospect_collaborators_guard_account_assignment')
    expect(migration).toContain('new.next_followup_at is distinct from old.next_followup_at')
    expect(migration).toContain('new.status not in (\'agreed\', \'not_interested\', \'archived\')')
    expect(migration).toContain("create or replace function public.create_red_comercial_prospect_activity")
    expect(migration).toContain("perform public.red_comercial_assert_prospect_contactable(p_prospect_id)")
  })

  test('exposes lead creation and friendly prospect/source labels in the account table', () => {
    expect(component).toContain("account.status === 'represented_lead'")
    expect(component).toContain("'Crear prospecto'")
    expect(component).toContain('Sin crear')
    expect(component).toContain('>Ver</button>')
    expect(component).toContain('account.has_linked_prospect')
    expect(component).toContain('hasLinkedProspect')
    expect(component).toContain('Detalle de cuenta')
    expect(component).toContain("manual: 'Registro manual'")
    expect(component).toContain("represented_company: 'Empresa representada'")
    expect(component).toContain('createRedComercialProspect(values)')
  })

  test('deletes only safe accounts through an admin-only RPC', () => {
    expect(migration).toContain('delete_red_comercial_account')
    expect(migration).toContain("if v_user is null or not public.is_red_comercial_admin()")
    expect(migration).toContain("'REDCOM_ACCOUNT_HAS_HISTORY'")
    expect(migration).toContain('v_account.linked_prospect_id is not null')
    expect(migration).toContain('delete from public.represented_company_accounts')
    expect(migration).toContain('linked_prospect_id uuid references public.represented_company_prospects(id) on delete set null')
    expect(component).toContain('Eliminar cuenta')
    expect(component).toContain('Eliminar permanentemente')
  })

  test('maps account deletion RPC errors instead of falling back to the generic banner', () => {
    expect(migration).toContain("raise exception 'REDCOM_ACCOUNT_HAS_HISTORY'")
    expect(migration).toContain("raise exception 'REDCOM_ACCOUNT_NOT_FOUND'")
    expect(component).toContain('deleteRedComercialCompanyAccount(deletingAccount.id)')
    expect(repository).toContain("failRpc<{ id: string; deleted: boolean } | null>(null, error, 'red_comercial.company.accounts.delete')")
    expect(repository).toContain('REDCOM_ACCOUNT_HAS_HISTORY')
    expect(repository).toContain('REDCOM_ACCOUNT_NOT_FOUND')
  })

  test('ships account deletion separately for already-applied phase two migrations', () => {
    expect(deleteMigration).toContain('create or replace function public.delete_red_comercial_account(p_account_id uuid)')
    expect(deleteMigration).toContain('security definer')
    expect(deleteMigration).toContain("set search_path = ''")
    expect(deleteMigration).toContain("raise exception 'REDCOM_ADMIN_REQUIRED'")
    expect(deleteMigration).toContain("raise exception 'REDCOM_ACCOUNT_HAS_HISTORY'")
    expect(deleteMigration).toContain("grant execute on function public.delete_red_comercial_account(uuid) to authenticated")
    expect(deleteMigration).not.toContain('create table public.represented_company_accounts')
    expect(deleteMigration).not.toContain('import_red_comercial_company_accounts')
  })
})
