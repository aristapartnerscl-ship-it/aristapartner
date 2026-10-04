import { describe, expect, test } from 'vitest'
import { getOpportunityFinancialCue, getOpportunityPresentation } from './opportunity-status'

describe('opportunity status presentation', () => {
  test('uses the shared control palette', () => {
    expect(getOpportunityPresentation('control', 'arista')).toMatchObject({ label: 'Gestión Arista' })
    expect(getOpportunityPresentation('control', 'arista').className).toContain('bg-[#e7f0ea]')
  })

  test('maps administrative states without exposing unknown values', () => {
    expect(getOpportunityPresentation('contract', 'pending').label).toBe('Pendiente')
    expect(getOpportunityPresentation('payment', 'partial').label).toBe('Pago parcial')
    expect(getOpportunityPresentation('commission', 'pending_payment').label).toBe('Pendiente de pago')
    expect(getOpportunityPresentation('result', 'won').label).toBe('Ganada')
  })

  test('separates client payment from collaborator participation', () => {
    expect(getOpportunityPresentation('payment', 'paid').label).toBe('Cliente pagó')
    expect(getOpportunityPresentation('commission', 'pending_payment').label).toBe('Pendiente de pago')
    expect(getOpportunityFinancialCue('paid', 'pending_payment').label).toContain('Participacion pendiente')
    expect(getOpportunityFinancialCue('overdue', 'not_generated').rowClassName).toContain('border-l-rose')
    expect(getOpportunityFinancialCue('paid', 'paid').label).toBe('Participacion pagada')
  })
})
