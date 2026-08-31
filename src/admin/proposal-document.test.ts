import { describe, expect, test } from 'vitest'
import type { CommercialProposalVersionRecord, CommercialProposalWithOpportunity } from '../types/admin'
import { buildProposalDocumentModel, getProposalFileName } from './proposal-document'

const proposal = { proposal_code: 'PROP-2026-00000001', proposal_id: 'proposal-1', id: 'proposal-1', opportunity_id: 'op-1', title: 'Actual', description: 'Descripción actual', currency: 'CLP', subtotal: 900000, tax_percentage: 19, tax_amount: 171000, total_amount: 1071000, valid_until: '2026-09-15', status: 'negotiation', sent_at: null, viewed_at: null, accepted_at: null, rejected_at: null, internal_notes: 'Nunca debe salir', client_notes: 'Condiciones para el cliente', archived_at: null, archived_by: null, created_by: 'owner-1', created_at: '2026-08-31T12:00:00.000Z', updated_at: '2026-08-31T12:00:00.000Z', opportunity: { id: 'op-1', reference_code: 'ARI-2026-000001', title: 'Operación', opportunity_type: 'sell', status: 'active', contact_id: 'contact-1' }, contact: { id: 'contact-1', contact_type: 'person', full_name: 'Juan Pérez', company_name: 'Empresa XYZ', email: 'juan@example.com', phone: '+56911111111', city: 'Santiago', country: 'CL' } } as CommercialProposalWithOpportunity

function version(overrides: Partial<CommercialProposalVersionRecord> = {}) { return { id: 'version-1', proposal_id: 'proposal-1', version_number: 1, title: 'Histórica', description: 'Descripción histórica', currency: 'CLP', subtotal: 1000000, tax_percentage: 19, tax_amount: 190000, total_amount: 1190000, valid_until: '2026-09-01', client_notes: 'Nota histórica', snapshot_data: { internal_notes: 'privada' }, created_by: 'owner-1', created_at: '2026-08-27T12:00:00.000Z', ...overrides }
}

describe('proposal document model', () => {
  test('usa exclusivamente los valores históricos y excluye información interna', () => {
    const model = buildProposalDocumentModel(proposal, version(), null)
    expect(model.totalAmount).toBe(1190000)
    expect(model.clientNotes).toBe('Nota histórica')
    expect(JSON.stringify(model)).not.toContain('Nunca debe salir')
    expect(JSON.stringify(model)).not.toContain('privada')
    expect(model.counterparty).toBe('Empresa XYZ')
  })

  test('genera un nombre profesional y sanitizado', () => {
    expect(getProposalFileName('PROP-2026/0001', 2)).toBe('Arista_PROP-2026_0001_v2.pdf')
  })
})
