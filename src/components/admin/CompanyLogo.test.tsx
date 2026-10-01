import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { CompanyLogo } from './CompanyLogo'

describe('CompanyLogo', () => {
  test('muestra iniciales corporativas cuando no hay logo', () => {
    render(<CompanyLogo company={{ name: 'Centro Psicovinculo', logo_storage_path: null }} />)

    expect(screen.getByLabelText('Iniciales de Centro Psicovinculo')).toHaveTextContent('CP')
  })
})
