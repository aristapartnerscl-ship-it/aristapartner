import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminDashboard } from './AdminDashboard'
import { adminRepository } from '../../repositories'

vi.mock('../../repositories', () => ({
  adminRepository: {
    getDashboardData: vi.fn(),
  },
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders no pending dashboard follow-ups when repository excludes completed actions', async () => {
    vi.mocked(adminRepository.getDashboardData).mockResolvedValue({
      error: null,
      data: {
        metrics: {
          newOpportunities: 0,
          activeOpportunities: 0,
          negotiations: 0,
          overdueFollowUps: 0,
          pendingSuppliers: 0,
          newInquiries: 0,
          newFormSubmissions: 2,
        },
        upcomingActions: [],
        recentActivities: [
          {
            id: 'completed-activity',
            opportunity_id: 'opportunity-1',
            title: 'Actividad completada reciente',
            activity_type: 'follow_up',
            next_action_at: '2026-08-12T12:00:00.000Z',
            occurred_at: '2026-08-13T12:00:00.000Z',
            completed_at: '2026-08-13T13:00:00.000Z',
            completed_by: 'owner-1',
          },
        ],
        hasMetricErrors: false,
        activityError: false,
      },
    })

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Seguimientos vencidos')).toBeInTheDocument()
    expect(screen.getByText('Recepciones nuevas').closest('a')).toHaveAttribute('href', '/admin/recepciones?status=received')
    expect(screen.getByText('Actividad completada reciente')).toBeInTheDocument()
    expect(screen.getByText('No hay registros para mostrar.')).toBeInTheDocument()
  })
})
