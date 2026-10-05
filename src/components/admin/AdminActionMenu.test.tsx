import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test, vi } from 'vitest'
import { AdminActionMenu } from './AdminActionMenu'

describe('AdminActionMenu', () => {
  test('abre, ejecuta una acción y se cierra con Escape', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AdminActionMenu items={[{ label: 'Ver detalle', onSelect }]} />)

    await user.click(screen.getByRole('button', { name: 'Acciones' }))
    expect(screen.getByRole('menuitem', { name: 'Ver detalle' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menuitem', { name: 'Ver detalle' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Acciones' }))
    await user.click(screen.getByRole('menuitem', { name: 'Ver detalle' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
