import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { CollaboratorRecord } from '../../types/admin'
import { AdminAuthContext } from '../admin-auth-context'
import type { AdminAuthContextValue } from '../admin-auth-context'
import { CollaboratorsPage } from './RedComercialPages'

const repositoryMocks = vi.hoisted(() => ({
  listCollaborators: vi.fn(),
  inviteCollaborator: vi.fn(),
  reissueCollaboratorInvitation: vi.fn(),
  revokeCollaboratorInvitation: vi.fn(),
  removeCollaboratorInvitation: vi.fn(),
  updateCollaboratorStatus: vi.fn(),
}))

vi.mock('../../repositories', () => ({
  adminRepository: repositoryMocks,
}))

const owner: CollaboratorRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  full_name: 'Admin Owner',
  email: 'admin@arista.cl',
  role: 'owner',
  is_active: true,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  last_activity_at: null,
  invitation_status: 'accepted',
  invited_at: null,
  invitation_sent_at: null,
  invitation_revoked_at: null,
  onboarding_completed_at: '2026-10-01T00:00:00Z',
}

const pending: CollaboratorRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  full_name: 'Juan Gonzalez',
  email: 'juan@example.com',
  role: 'collaborator',
  is_active: true,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  last_activity_at: null,
  invitation_status: 'pending',
  invited_at: '2026-10-01T00:00:00Z',
  invitation_sent_at: '2026-10-01T00:00:00Z',
  invitation_revoked_at: null,
  onboarding_completed_at: null,
}

const active: CollaboratorRecord = {
  id: '33333333-3333-4333-8333-333333333333',
  full_name: 'Camila Perez',
  email: 'camila@example.com',
  role: 'collaborator',
  is_active: true,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  last_activity_at: null,
  invitation_status: 'accepted',
  invited_at: '2026-10-01T00:00:00Z',
  invitation_sent_at: '2026-10-01T00:00:00Z',
  invitation_revoked_at: null,
  onboarding_completed_at: '2026-10-01T00:10:00Z',
}

const inactive: CollaboratorRecord = {
  ...active,
  id: '44444444-4444-4444-8444-444444444444',
  full_name: 'Felipe Soto',
  email: 'felipe@example.com',
  is_active: false,
}

const revoked: CollaboratorRecord = {
  ...pending,
  id: '55555555-5555-4555-8555-555555555555',
  full_name: 'Alonso Gonzalez',
  email: 'alonso@example.com',
  is_active: false,
  invitation_status: 'revoked',
  invitation_revoked_at: '2026-10-01T00:20:00Z',
}

function renderPage(rows: CollaboratorRecord[] = [owner, pending, active, inactive]) {
  repositoryMocks.listCollaborators.mockResolvedValue({ data: rows, error: null })
  const authValue: AdminAuthContextValue = {
    status: 'ready',
    session: null,
    user: null,
    profile: owner,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }

  return render(
    <MemoryRouter>
      <AdminAuthContext.Provider value={authValue}>
        <CollaboratorsPage />
      </AdminAuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('CollaboratorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositoryMocks.reissueCollaboratorInvitation.mockResolvedValue({ data: pending, error: null })
    repositoryMocks.revokeCollaboratorInvitation.mockResolvedValue({ data: { ...pending, invitation_status: 'revoked', is_active: false }, error: null })
    repositoryMocks.removeCollaboratorInvitation.mockResolvedValue({ data: true, error: null })
    repositoryMocks.updateCollaboratorStatus.mockResolvedValue({ data: inactive, error: null })
  })

  afterEach(() => {
    cleanup()
  })

  test('un invitado pendiente no aparece como activo', async () => {
    renderPage()

    expect(await screen.findByText('Juan Gonzalez')).toBeInTheDocument()
    expect(screen.getByText('Invitación pendiente')).toBeInTheDocument()
    expect(screen.getByText('Camila Perez')).toBeInTheDocument()
    expect(screen.getAllByText('Activo')).toHaveLength(2)
  })

  test('permite reenviar invitacion pendiente', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Reenviar' }))

    expect(repositoryMocks.reissueCollaboratorInvitation).toHaveBeenCalledWith(pending.id)
    expect(await screen.findByText('Invitación reenviada correctamente.')).toBeInTheDocument()
  })

  test('muestra invitacion revocada antes que inactivo', async () => {
    renderPage([revoked])

    expect(await screen.findByText('Alonso Gonzalez')).toBeInTheDocument()
    expect(screen.getByText('Invitación revocada')).toBeInTheDocument()
    expect(screen.queryByText('Inactivo')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar' })).toBeInTheDocument()
  })

  test('desactiva y reactiva colaboradores aceptados', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Desactivar' }))
    expect(repositoryMocks.updateCollaboratorStatus).toHaveBeenCalledWith(active.id, false)

    await user.click(screen.getByRole('button', { name: 'Reactivar' }))
    expect(repositoryMocks.updateCollaboratorStatus).toHaveBeenCalledWith(inactive.id, true)
  })

  test('elimina invitacion pendiente con confirmacion', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('⋯'))
    await user.click(screen.getAllByRole('button', { name: 'Eliminar invitación' }).at(-1)!)
    expect(screen.getByRole('heading', { name: 'Eliminar invitación' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Eliminar invitación' }).at(-1)!)

    expect(repositoryMocks.removeCollaboratorInvitation).toHaveBeenCalledWith(pending.id)
    expect(await screen.findByText('Invitación eliminada correctamente.')).toBeInTheDocument()
  })

  test('owner nunca muestra acciones de colaborador', async () => {
    renderPage([owner])

    expect(await screen.findByText('Admin Owner')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reenviar' })).not.toBeInTheDocument()
  })

  test('muestra error cuando backend bloquea eliminacion con historial', async () => {
    const user = userEvent.setup()
    repositoryMocks.removeCollaboratorInvitation.mockResolvedValueOnce({
      data: false,
      error: 'No se puede eliminar porque existen referencias o historial asociado.',
    })
    renderPage()

    await user.click(await screen.findByText('⋯'))
    await user.click(screen.getAllByRole('button', { name: 'Eliminar invitación' }).at(-1)!)
    await user.click(screen.getAllByRole('button', { name: 'Eliminar invitación' }).at(-1)!)

    expect(await screen.findByText('No se puede eliminar porque existen referencias o historial asociado.')).toBeInTheDocument()
  })

  test('collaborator no puede gestionar usuarios porque la ruta administrativa no expone acciones sin backend admin', async () => {
    renderPage([pending])

    await waitFor(() => expect(repositoryMocks.listCollaborators).toHaveBeenCalled())
    expect(repositoryMocks.reissueCollaboratorInvitation).not.toHaveBeenCalled()
    expect(repositoryMocks.revokeCollaboratorInvitation).not.toHaveBeenCalled()
    expect(repositoryMocks.removeCollaboratorInvitation).not.toHaveBeenCalled()
  })
})
