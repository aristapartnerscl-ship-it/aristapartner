import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminAuthContext } from '../admin-auth-context'
import { AdminFollowUps } from './AdminFollowUps'
import { adminRepository } from '../../repositories'
import type { FollowUpRecord, OpportunityActivityRecord } from '../../types/admin'

vi.mock('../../repositories', () => ({
  adminRepository: {
    listFollowUps: vi.fn(),
    listCompletedFollowUps: vi.fn(),
    completeFollowUp: vi.fn(),
    reopenFollowUp: vi.fn(),
  },
}))

const pendingFollowUp: FollowUpRecord = {
  id: 'activity-pending',
  opportunity_id: 'opportunity-1',
  activity_type: 'follow_up',
  title: 'Llamar a cliente',
  description: null,
  occurred_at: '2026-08-13T12:00:00.000Z',
  next_action_at: '2026-08-14T12:00:00.000Z',
  completed_at: null,
  completed_by: null,
  created_at: '2026-08-13T12:00:00.000Z',
  created_by: 'owner-1',
  opportunity: {
    id: 'opportunity-1',
    reference_code: 'ARI-2026-ABC123',
    title: 'Compra de insumos',
    status: 'active',
    contact_id: 'contact-1',
  },
  contact: {
    id: 'contact-1',
    contact_type: 'company',
    full_name: null,
    company_name: 'Arista Partners',
    email: null,
    phone: null,
    city: null,
    country: null,
  },
  completedByProfile: null,
}

function renderWithAuth() {
  return render(
    <MemoryRouter>
      <AdminAuthContext.Provider
        value={{
          status: 'ready',
          session: null,
          user: { id: 'owner-1', email: 'owner@example.com' } as never,
          profile: {
            id: 'owner-1',
            full_name: 'Owner Admin',
            role: 'owner',
            is_active: true,
            created_at: '',
            updated_at: '',
          },
          signIn: vi.fn(),
          signOut: vi.fn(),
          sendPasswordRecovery: vi.fn(),
        }}
      >
        <AdminFollowUps />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminFollowUps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminRepository.listFollowUps).mockResolvedValue({ data: [pendingFollowUp], error: null })
    vi.mocked(adminRepository.listCompletedFollowUps).mockResolvedValue({ data: [], error: null })
  })

  test('moves a pending follow-up to completed and back without moving focus unexpectedly', async () => {
    const user = userEvent.setup()
    const completedActivity: OpportunityActivityRecord = {
      ...pendingFollowUp,
      completed_at: '2026-08-14T13:00:00.000Z',
      completed_by: 'owner-1',
    }
    vi.mocked(adminRepository.completeFollowUp).mockResolvedValue({ data: completedActivity, error: null })
    vi.mocked(adminRepository.reopenFollowUp).mockResolvedValue({
      data: { ...completedActivity, completed_at: null, completed_by: null },
      error: null,
    })

    renderWithAuth()

    expect((await screen.findAllByText((_, element) => element?.textContent?.includes('Llamar a cliente') ?? false)).length).toBeGreaterThan(0)
    const completeButton = screen.getByRole('button', { name: /Marcar como completada/i })
    completeButton.focus()
    await user.click(completeButton)

    expect(screen.queryByRole('button', { name: /Marcar como completada/i })).not.toBeInTheDocument()
    expect(screen.getByText('Seguimiento marcado como completado.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Mostrar/i }))
    const completedSection = screen.getByRole('button', { name: /Completadas/i }).closest('section')!
    expect(within(completedSection).getAllByText((_, element) => element?.textContent?.includes('Llamar a cliente') ?? false).length).toBeGreaterThan(0)

    const reopenButton = within(completedSection).getByRole('button', { name: /Reabrir/i })
    reopenButton.focus()
    await user.click(reopenButton)

    expect(screen.getByRole('button', { name: /Marcar como completada/i })).toBeInTheDocument()
    expect(screen.getByText('Seguimiento reabierto.')).toBeInTheDocument()
    expect(document.activeElement).not.toBe(document.body)
  })
})
