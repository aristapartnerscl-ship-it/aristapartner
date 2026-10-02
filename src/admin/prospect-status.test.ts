import { describe, expect, test } from 'vitest'
import { getProspectStatusPresentation } from './prospect-status'

describe('prospect status presentation', () => {
  test('uses the same semantic palette for panel and tables', () => {
    const agreed = getProspectStatusPresentation('agreed')
    const pending = getProspectStatusPresentation('contacted_no_response')

    expect(agreed.label).toBe('Acordado')
    expect(agreed.backgroundClass).toContain('bg-[#e7f0ea]')
    expect(pending.label).toBe('Contactado - sin respuesta')
    expect(pending.accentClass).toContain('amber')
  })

  test('falls back safely for an unknown status', () => {
    expect(getProspectStatusPresentation('unknown').label).toBe('Por contactar')
  })
})
