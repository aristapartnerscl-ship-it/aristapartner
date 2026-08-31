import { Archive, Download, FilePlus2, Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { CommercialProposalDocumentRecord, CommercialProposalVersionRecord, CommercialProposalWithOpportunity, OrganizationSettingsRecord } from '../../types/admin'
import { ProposalDocumentPreview } from '../ProposalDocumentPreview'
import { buildProposalDocumentModel, formatProposalDate, formatProposalMoney, getProposalFileName } from '../proposal-document'
import { generateProposalPdf } from '../proposal-pdf'
import { opportunityTypeLabels, proposalStatusLabels } from '../opportunity-labels'

export function AdminProposalWorkspace() {
  const { id } = useParams()
  const [proposal, setProposal] = useState<CommercialProposalWithOpportunity | null>(null)
  const [versions, setVersions] = useState<CommercialProposalVersionRecord[]>([])
  const [documents, setDocuments] = useState<CommercialProposalDocumentRecord[]>([])
  const [organization, setOrganization] = useState<OrganizationSettingsRecord | null>(null)
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true); setError('')
    const [proposalResult, versionsResult, documentsResult, settingsResult] = await Promise.all([
      adminRepository.getCommercialProposalById(id),
      adminRepository.listCommercialProposalVersions(id),
      adminRepository.listCommercialProposalDocuments(id),
      adminRepository.getOrganizationSettings(),
    ])
    setLoading(false)
    if (proposalResult.error) { setError(proposalResult.error); return }
    setProposal(proposalResult.data)
    setVersions(versionsResult.error ? [] : versionsResult.data)
    setDocuments(documentsResult.error ? [] : documentsResult.data)
    setOrganization(settingsResult.error ? null : settingsResult.data)
    if (!selectedVersionId && versionsResult.data[0]) setSelectedVersionId(versionsResult.data[0].id)
  }, [id, selectedVersionId])

  useEffect(() => { void load() }, [load])

  const selectedVersion = useMemo(() => versions.find((item) => item.id === selectedVersionId) ?? versions[0] ?? null, [selectedVersionId, versions])
  const documentModel = proposal && selectedVersion ? buildProposalDocumentModel(proposal, selectedVersion, organization) : null

  async function createVersion() {
    if (!proposal || processing) return
    setProcessing(true); setError(''); setMessage('')
    const result = await adminRepository.createCommercialProposalVersion(proposal.id)
    setProcessing(false)
    if (result.error || !result.data) { setError(result.error ?? 'No fue posible crear la versión.'); return }
    setSelectedVersionId(result.data.id); setMessage(`Versión ${result.data.version_number} creada como snapshot inmutable.`); void load()
  }

  async function generatePdf(version = selectedVersion) {
    const model = proposal && version ? buildProposalDocumentModel(proposal, version, organization) : null
    if (!proposal || !model || processing) return
    setProcessing(true); setError(''); setMessage('')
    const fileName = getProposalFileName(model.code, model.version)
    const record = await adminRepository.createCommercialProposalDocument({ proposal_id: proposal.id, version_id: version.id, document_type: 'pdf', file_name: fileName })
    if (record.error) { setProcessing(false); setError(record.error); return }
    const generated = await generateProposalPdf(model)
    generated.pdf.save(generated.fileName)
    setProcessing(false); setMessage('PDF generado y registrado. La propuesta conserva su estado actual.'); void load()
  }

  async function archive() {
    if (!proposal || processing || !window.confirm('¿Archivar esta propuesta?')) return
    setProcessing(true); const result = await adminRepository.updateCommercialProposal(proposal.id, { archived_at: new Date().toISOString() }); setProcessing(false)
    if (result.error) setError(result.error); else { setMessage('Propuesta archivada.'); void load() }
  }

  if (loading) return <div className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white" />
  if (error && !proposal) return <section className="rounded-lg border border-red-200 bg-red-50 p-6"><h2 className="font-semibold">No fue posible cargar la propuesta</h2><p className="mt-2 text-sm">{error}</p></section>
  if (!proposal) return <EmptyState title="Propuesta no encontrada" text="La propuesta solicitada no está disponible." />
  return <div className="grid gap-6">
    <AdminPageHeader title={proposal.proposal_code} text={proposal.title} />
    <div className="flex flex-wrap gap-3"><Link to="/admin/propuestas" className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold">Volver</Link><Link to={`/admin/propuestas/${proposal.id}/editar`} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold">Editar propuesta</Link>{proposal.status === 'accepted' && <Link to={`/admin/acuerdos/nuevo?opportunityId=${proposal.opportunity.id}`} className="rounded-md bg-[#235b3e] px-4 py-3 text-sm font-semibold text-white">Crear acuerdo comercial</Link>}{!proposal.archived_at && <button type="button" onClick={() => void archive()} disabled={processing} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold disabled:opacity-50"><Archive size={17} />Archivar</button>}</div>
    <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{error || message}</div>
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 md:grid-cols-2"><Info label="Estado" value={proposalStatusLabels[proposal.status]} /><Info label="Oportunidad" value={`${proposal.opportunity.reference_code} · ${proposal.opportunity.title}`} /><Info label="Contraparte" value={proposal.contact?.company_name || proposal.contact?.full_name || 'Sin contacto asociado'} /><Info label="Tipo" value={opportunityTypeLabels[proposal.opportunity.opportunity_type]} /></section>
    <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Versiones</h2><p className="mt-1 text-sm text-slate-600">Cada versión conserva los valores comerciales originales.</p></div><button type="button" onClick={() => void createVersion()} disabled={processing || Boolean(proposal.archived_at)} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><FilePlus2 size={17} />Crear nueva versión</button></div>{versions.length === 0 ? <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">Todavía no hay snapshots. Crea la primera versión para generar un documento trazable.</p> : <div className="grid gap-3">{versions.map((version, index) => <div key={version.id} className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => setSelectedVersionId(version.id)} className="text-left"><p className="font-semibold">Versión {version.version_number} {index === 0 && <span className="ml-2 rounded-md bg-[#e8f1eb] px-2 py-1 text-xs text-[#235b3e]">Actual</span>}</p><p className="mt-1 text-sm text-slate-600">{formatProposalDate(version.created_at)} · {formatProposalMoney(version.total_amount, version.currency)}</p></button><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelectedVersionId(version.id)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"><Plus size={15} />Ver</button><button type="button" onClick={() => { setSelectedVersionId(version.id); void generatePdf(version) }} disabled={processing} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50"><Download size={15} />Generar PDF</button></div></div>)}</div>}</section>
    {documentModel && <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Vista previa · Versión {selectedVersion?.version_number}</h2><p className="mt-1 text-sm text-slate-600">La vista previa y el PDF utilizan el mismo snapshot.</p></div><button type="button" onClick={() => void generatePdf()} disabled={processing} className="inline-flex items-center gap-2 rounded-md bg-[#235b3e] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Download size={17} />Generar PDF</button></div><ProposalDocumentPreview document={documentModel} /></section>}
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Documentos</h2>{documents.length === 0 ? <p className="text-sm text-slate-600">No hay documentos generados todavía.</p> : <div className="grid gap-2">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm"><span><strong>Versión {versions.find((version) => version.id === document.version_id)?.version_number ?? '—'}</strong> · {document.file_name}</span><span className="text-slate-500">{new Date(document.generated_at).toLocaleString('es-CL')}</span></div>)}</div>}</section>
  </div>
}

function Info({ label, value }: { label: string; value: string | null | undefined }) { return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-700">{value || 'Sin información'}</dd></div> }
