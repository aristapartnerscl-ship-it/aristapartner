import { CheckCircle2, Download, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProposalDocumentPreview } from '../admin/ProposalDocumentPreview'
import { buildPublicProposalDocumentModel } from '../admin/proposal-document'
import { generateProposalPdf } from '../admin/proposal-pdf'
import { resolvePublicProposal, respondToPublicProposal } from '../repositories/public-proposal-repository'
import type { PublicProposalPayload } from '../types/admin'

type ResponseMode = 'accepted' | 'rejected' | null

export function PublicProposal() {
  const { token = '' } = useParams()
  const loaded = useRef(false)
  const [proposal, setProposal] = useState<PublicProposalPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ResponseMode>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    void resolvePublicProposal(token).then((result) => { setLoading(false); if (!result.error) setProposal(result.data) })
  }, [token])

  async function downloadPdf() {
    if (!proposal || pdfLoading) return
    setPdfLoading(true)
    const result = await generateProposalPdf(buildPublicProposalDocumentModel(proposal))
    result.pdf.save(result.fileName)
    setPdfLoading(false)
  }

  async function submitResponse() {
    if (!proposal || !mode || saving || !confirmed || !name.trim() || !email.trim()) return
    setSaving(true); setMessage('')
    const result = await respondToPublicProposal(token, mode, name, email, comment)
    setSaving(false)
    if (result.error || !result.data.ok) { setMessage(result.error ?? result.data.message ?? 'No fue posible registrar la respuesta.'); return }
    setProposal({ ...proposal, status: 'responded', response: mode, response_name: name.trim(), response_email: email.trim().toLowerCase(), response_comment: comment.trim() || null, responded_at: new Date().toISOString() })
    setMode(null); setMessage(mode === 'accepted' ? 'Propuesta aceptada. Gracias. Tu respuesta fue registrada.' : 'Propuesta rechazada. Gracias. Tu respuesta fue registrada.')
  }

  if (loading) return <main className="min-h-screen bg-surface-muted px-5 py-16 text-center text-sm text-slate-600">Cargando propuesta...</main>
  if (!proposal) return <main className="flex min-h-screen items-center justify-center bg-surface-muted px-5 py-16"><section className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-lg font-semibold text-text">Esta propuesta no está disponible.</p></section></main>
  const document = buildPublicProposalDocumentModel(proposal)
  const responded = proposal.status === 'responded' || Boolean(proposal.response)
  return <main className="min-h-screen bg-surface-muted px-4 py-8 text-text sm:px-6 sm:py-12"><div className="mx-auto grid w-full max-w-4xl gap-5"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold tracking-[0.18em] text-brand">{document.organization.displayName}</p><p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">Documento comercial para revisión</p></div><button type="button" onClick={() => void downloadPdf()} disabled={pdfLoading} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"><Download size={17} />{pdfLoading ? 'Preparando...' : 'Descargar PDF'}</button></header><ProposalDocumentPreview document={document} />{responded ? <section className="rounded-lg border border-border bg-surface-muted p-6 text-center"><CheckCircle2 className="mx-auto text-brand" size={30} /><h2 className="mt-3 text-xl font-semibold">{proposal.response === 'accepted' ? 'Propuesta aceptada' : 'Propuesta rechazada'}</h2><p className="mt-2 text-sm text-slate-700">Gracias. Tu respuesta fue registrada.</p></section> : <ResponsePanel mode={mode} setMode={setMode} name={name} setName={setName} email={email} setEmail={setEmail} comment={comment} setComment={setComment} confirmed={confirmed} setConfirmed={setConfirmed} saving={saving} message={message} onSubmit={() => void submitResponse()} />}</div></main>
}

function ResponsePanel({ mode, setMode, name, setName, email, setEmail, comment, setComment, confirmed, setConfirmed, saving, message, onSubmit }: { mode: ResponseMode; setMode: (mode: ResponseMode) => void; name: string; setName: (value: string) => void; email: string; setEmail: (value: string) => void; comment: string; setComment: (value: string) => void; confirmed: boolean; setConfirmed: (value: boolean) => void; saving: boolean; message: string; onSubmit: () => void }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Respuesta a la propuesta</h2><p className="mt-2 text-sm text-slate-600">Registra una respuesta comercial. Esto no constituye una firma electrónica.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setMode('accepted')} className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-semibold text-white"><CheckCircle2 size={17} />Aceptar propuesta</button><button type="button" onClick={() => setMode('rejected')} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold"><XCircle size={17} />Rechazar propuesta</button></div>{mode && <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5"><h3 className="font-semibold">{mode === 'accepted' ? 'Confirmar aceptación' : 'Confirmar rechazo'}</h3><label className="grid gap-2 text-sm font-medium">Nombre<input value={name} onChange={(event) => setName(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" autoComplete="name" /></label><label className="grid gap-2 text-sm font-medium">Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-slate-300 px-3 py-3 text-base" autoComplete="email" /></label><label className="grid gap-2 text-sm font-medium">Comentario (opcional)<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} className="rounded-md border border-slate-300 px-3 py-3 text-base" /></label><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />Confirmo que deseo {mode === 'accepted' ? 'aceptar' : 'rechazar'} esta propuesta comercial.</label><div aria-live="polite" className="text-sm text-red-700">{message}</div><div className="flex flex-wrap gap-3"><button type="button" onClick={onSubmit} disabled={saving || !confirmed || !name.trim() || !email.trim()} className="rounded-md bg-graphite px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Registrando...' : 'Confirmar respuesta'}</button><button type="button" onClick={() => setMode(null)} disabled={saving} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold">Cancelar</button></div></div>}</section>
}
