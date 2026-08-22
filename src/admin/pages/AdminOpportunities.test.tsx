import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { adminRepository } from '../../repositories'
import type { OpportunityRecord } from '../../types/admin'
import { AdminOpportunities } from './AdminOpportunities'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listOpportunities: vi.fn(),
    listContactsForSelector: vi.fn(),
    listFollowUps: vi.fn(),
  },
}))

const opportunity: OpportunityRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  reference_code: 'ARI-2026-ABC123',
  opportunity_type: 'buy',
  title: 'Compra de insumos',
  description: null,
  contact_id: null,
  status: 'new',
  priority: 'medium',
  source: 'internal',
  estimated_value: null,
  currency: null,
  expected_date: null,
  country: null,
  region: null,
  city: null,
  internal_notes: null,
  rejection_reason: null,
  assigned_to: 'owner-1',
  created_at: '2026-08-13T12:00:00.000Z',
  updated_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
}

describe('AdminOpportunities responsive layout', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminRepository.listOpportunities).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listContactsForSelector).mockResolvedValue({ data: [], error: null })
    vi.mocked(adminRepository.listFollowUps).mockResolvedValue({ data: [], error: null })
  })

  test('renders filters as bounded controls with responsive grid classes', async () => {
    render(<MemoryRouter><AdminOpportunities /></MemoryRouter>)

    const state = await screen.findByLabelText('Estado')
    const filterGrid = state.parentElement?.parentElement

    expect(filterGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-5')
    expect(state).toHaveClass('w-full', 'min-w-0')
    expect(screen.getByLabelText('Contacto')).toHaveClass('w-full', 'min-w-0')
  })

  test('keeps the desktop table scroll within its own container', async () => {
    vi.mocked(adminRepository.listOpportunities).mockResolvedValue({ data: [opportunity], error: null })
    render(<MemoryRouter><AdminOpportunities /></MemoryRouter>)

    const table = await screen.findByRole('table')
    expect(table.parentElement).toHaveClass('max-w-full', 'overflow-x-auto')
  })
})
