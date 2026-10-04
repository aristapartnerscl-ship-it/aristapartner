import { describe, expect, it } from 'vitest';
import migration from '../../supabase/migrations/20261004205615_red_comercial_integrity_hardening.sql?raw';

describe('red comercial integrity hardening migration', () => {
  it('requires collaborator attribution for commission-bearing states', () => {
    expect(migration).toContain("commission_status not in ('to_validate', 'generated', 'pending_payment', 'paid')");
    expect(migration).toContain('AP_ATTRIBUTED_COLLABORATOR_REQUIRED');
  });

  it('keeps compensation fields coherent with attribution and type', () => {
    expect(migration).toContain('red_opportunity_compensation_null_without_attribution_check');
    expect(migration).toContain('AP_COMPENSATION_REQUIRES_ATTRIBUTION');
    expect(migration).toContain('AP_INVALID_PERCENTAGE_COMPENSATION');
    expect(migration).toContain('between 0 and 100');
    expect(migration).toContain('AP_INVALID_FIXED_COMPENSATION');
    expect(migration).toContain("new.collaborator_compensation_type = 'fixed_amount'");
  });

  it('makes collaborator handoff explicit without requiring a timestamp for direct Arista opportunities', () => {
    expect(migration).toContain("set control_mode = 'arista', handed_off_at = coalesce(handed_off_at, now())");
    expect(migration).toContain("v_existing.control_mode in ('collaborator', 'shared')");
    expect(migration).toContain('v_should_mark_handoff');
    expect(migration).not.toContain('red_opportunity_handoff_requires_timestamp');
  });

  it('keeps closed_at synchronized with terminal result states', () => {
    expect(migration).toContain("new.result_status in ('won', 'lost', 'cancelled')");
    expect(migration).toContain("new.result_status = 'in_process'");
    expect(migration).toContain('new.closed_at := null');
  });

  it('excludes terminal prospects through one shared follow-up helper', () => {
    expect(migration).toContain('red_comercial_is_terminal_prospect_status');
    expect(migration).toContain("p_status in ('agreed', 'not_interested', 'archived')");
  });

  it('serializes cross-opportunity conversion and rejects repeat conversion', () => {
    expect(migration).toContain('pg_catalog.pg_advisory_xact_lock');
    expect(migration).toContain("v_cross.status in ('converted', 'discarded')");
    expect(migration).toContain("where id = p_cross_id and status not in ('converted', 'discarded')");
    expect(migration).not.toMatch(/drop\s+table/i);
    expect(migration).not.toMatch(/truncate\s+/i);
    expect(migration).not.toMatch(/delete\s+from/i);
  });
});
