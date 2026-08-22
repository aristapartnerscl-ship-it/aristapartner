import { describe, expect, test } from 'vitest'
import { corsHeaders, isAllowedOrigin } from './cors.ts'
import { parseJsonBody, validatePublicForm } from './validation.ts'

const validBuy = {
  submissionType: 'buy',
  data: {
    fullName: 'Ana Torres',
    organization: 'Arista Cliente',
    role: '',
    email: 'ana@example.com',
    phone: '+569 1234 5678',
    city: 'Santiago',
    region: 'RM',
    country: 'Chile',
    need: 'Insumos',
    needDetail: 'Necesito comprar insumos industriales certificados.',
    volume: '',
    budget: '',
    currency: 'CLP',
    deadline: '',
    deliveryPlace: '',
    hasQuotes: 'No',
    additionalInfo: '',
  },
  consentContact: true,
  consentMarketing: false,
  privacyVersion: 'Borrador 0.1',
  turnstileToken: 'token',
  website: '',
}

describe('submit-public-form validation', () => {
  test('rejects oversized body and invalid JSON', () => {
    expect(parseJsonBody('{').ok).toBe(false)
    expect(parseJsonBody('x'.repeat(51 * 1024)).ok).toBe(false)
  })

  test('rejects invalid submission type, unknown fields and false consent', () => {
    expect(validatePublicForm({ ...validBuy, submissionType: 'other' }).ok).toBe(false)
    expect(validatePublicForm({ ...validBuy, data: { ...validBuy.data, unsafe: 'x' } }).ok).toBe(false)
    expect(validatePublicForm({ ...validBuy, consentContact: false }).ok).toBe(false)
  })

  test('handles honeypot neutrally without validating payload for insertion', () => {
    const result = validatePublicForm({ ...validBuy, website: 'https://spam.example' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('honeypot')
  })

  test('normalizes a minimum valid payload and strips empty strings to null', () => {
    const result = validatePublicForm(validBuy)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.submissionType).toBe('buy')
      expect(result.value.payload.role).toBeNull()
      expect(result.value.payload.fullName).toBe('Ana Torres')
    }
  })

  test('does not insert fields not allowed by schema', () => {
    const result = validatePublicForm({ ...validBuy, data: { ...validBuy.data, token: 'secret' } })
    expect(result.ok).toBe(false)
  })

  test('rejects nested objects and invalid URLs', () => {
    expect(validatePublicForm({ ...validBuy, data: { ...validBuy.data, need: { text: 'x' } } }).ok).toBe(false)
    const sell = {
      ...validBuy,
      submissionType: 'sell',
      data: {
        fullName: 'Ana Torres',
        company: 'Empresa',
        role: '',
        email: 'ana@example.com',
        phone: '+569',
        website: 'javascript:alert(1)',
        social: '',
        city: '',
        region: '',
        country: 'Chile',
        offer: 'Oferta',
        offerDetail: 'Detalle suficiente de la oferta comercial.',
        targetClient: '',
        coverage: '',
        capacity: '',
        priceRange: '',
        currency: '',
        channel: '',
        differentiators: '',
        additionalInfo: '',
      },
    }
    expect(validatePublicForm(sell).ok).toBe(false)
  })
})

describe('submit-public-form CORS', () => {
  test('allows explicit origins and does not reflect unauthorized origins', () => {
    const allowed = ['http://localhost:5174']
    expect(isAllowedOrigin('http://localhost:5174', allowed)).toBe(true)
    expect(isAllowedOrigin('https://evil.example', allowed)).toBe(false)
    expect(corsHeaders('https://evil.example', allowed)).not.toHaveProperty('Access-Control-Allow-Origin')
  })
})
