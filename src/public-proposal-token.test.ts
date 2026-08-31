import { describe, expect, test } from 'vitest'
import { generatePublicProposalToken, hashPublicProposalToken } from './public-proposal-token'

describe('public proposal tokens', () => {
  test('uses cryptographic randomness and produces a stable SHA-256 hash', async () => {
    const first = generatePublicProposalToken()
    const second = generatePublicProposalToken()
    expect(first).toHaveLength(32)
    expect(first).not.toBe(second)
    expect(first).toMatch(/^[0-9A-Za-z_-]+$/)
    expect(await hashPublicProposalToken(first)).toHaveLength(64)
    expect(await hashPublicProposalToken(first)).toBe(await hashPublicProposalToken(first))
  })

  test('does not depend on Math.random', async () => {
    const original = Math.random
    Math.random = () => { throw new Error('Math.random no debe usarse para tokens') }
    try { expect(await hashPublicProposalToken(generatePublicProposalToken())).toHaveLength(64) } finally { Math.random = original }
  })
})
