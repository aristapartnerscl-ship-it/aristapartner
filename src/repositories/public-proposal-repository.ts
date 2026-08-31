import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { PublicProposalPayload } from '../types/admin'
import { hashPublicProposalToken } from '../public-proposal-token'

type PublicResponse = { ok: boolean; response?: 'accepted' | 'rejected'; version?: number; message?: string }

function unavailable<T>(data: T) { return { data, error: 'Esta propuesta no está disponible.' } }

export async function resolvePublicProposal(token: string) {
  if (!supabase || !token) return unavailable<PublicProposalPayload | null>(null)
  const tokenHash = await hashPublicProposalToken(token)
  const client = supabase as SupabaseClient
  const { data, error } = await client.rpc('resolve_commercial_proposal_public_link', { p_token_hash: tokenHash })
  if (error || !data) return unavailable<PublicProposalPayload | null>(null)
  return { data: data as PublicProposalPayload, error: null }
}

export async function respondToPublicProposal(token: string, response: 'accepted' | 'rejected', name: string, email: string, comment: string) {
  if (!supabase || !token) return unavailable<PublicResponse>({ ok: false })
  const tokenHash = await hashPublicProposalToken(token)
  const client = supabase as SupabaseClient
  const { data, error } = await client.rpc('respond_commercial_proposal_public_link', {
    p_token_hash: tokenHash,
    p_response: response,
    p_response_name: name.trim(),
    p_response_email: email.trim().toLowerCase(),
    p_response_comment: comment.trim() || null,
  })
  if (error || !data) return unavailable<PublicResponse>({ ok: false })
  return { data: data as PublicResponse, error: null }
}
