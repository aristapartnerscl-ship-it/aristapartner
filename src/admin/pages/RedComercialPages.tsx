import { AlertTriangle, ArrowRight, Building2, CheckCircle2, FileText, Layers, Link as LinkIcon, LockKeyhole, Radar, RefreshCcw, Star, Target, Upload, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { AdminKpiCard } from '../../components/admin/AdminVisualSystem'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { CompanyMaterialsPanel } from '../components/CompanyMaterialsPanel'
import { CompanyWorkspaceChips, CompanyWorkspaceFaqList, CompanyWorkspaceList, CompanyWorkspaceMaterialList, CompanyWorkspaceSection as IntelligenceSection } from '../components/CompanyWorkspacePrimitives'
import { extractCommercialItems, extractFirstQuestion, extractProblemItems, splitCommercialItems } from '../components/CompanyWorkspaceUtils'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { CollaboratorRecord, RedComercialCompanyWorkspace, RedComercialHomeData, RepresentedCompanyFaqRecord, RepresentedCompanyFormValues, RepresentedCompanyMembershipRecord, RepresentedCompanyRecord } from '../../types/admin'
import { formatList, getCompanyAccentColor, hexToRgba, isRedComercialAdmin } from '../red-comercial-utils'
import { useAdminAuth } from '../useAdminAuth'

const emptyCompanyForm: RepresentedCompanyFormValues = {
  name: '',
  slug: '',
  description: '',
  website_url: '',
  status: 'active',
  offer_summary: '',
  problem_solved: '',
  ideal_customer: '',
  target_industries: '',
  territory: '',
  keywords: '',
  opportunity_examples: '',
  what_not_to_promise: '',
  logo_storage_path: '',
  logo_source: 'fallback',
}

function toForm(company: RepresentedCompanyRecord): RepresentedCompanyFormValues {
  return {
    name: company.name,
    slug: company.slug,
    description: company.description ?? '',
    website_url: company.website_url ?? '',
    status: company.status,
    offer_summary: company.offer_summary ?? '',
    problem_solved: company.problem_solved ?? '',
    ideal_customer: company.ideal_customer ?? '',
    target_industries: company.target_industries.join(', '),
    territory: company.territory ?? '',
    keywords: company.keywords.join(', '),
    opportunity_examples: company.opportunity_examples.join('\n'),
    what_not_to_promise: company.what_not_to_promise ?? '',
    logo_storage_path: company.logo_storage_path ?? '',
    logo_source: company.logo_source,
  }
}

function LoadingBlock({ text = 'Cargando...' }: { text?: string }) {
  return <div className="rounded-xl border border-[#ddd6ca] bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_1px_2px_rgba(23,32,45,0.03)]">{text}</div>
}

function ErrorBlock({ text }: { text: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800 shadow-[0_1px_2px_rgba(127,29,29,0.04)]">{text}</div>
}

function companyDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function isUuid(value: string | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Building2 }) {
  return <AdminKpiCard label={label} value={value} icon={Icon} tone="neutral" />
}

function CompanyCard({ company, canEdit, onEdit }: { company: RepresentedCompanyRecord; canEdit: boolean; onEdit?: (company: RepresentedCompanyRecord) => void }) {
  const accentColor = getCompanyAccentColor(company)
  const cardStyle = {
    '--company-accent-border': hexToRgba(accentColor, 0.32),
    background: `linear-gradient(135deg, ${hexToRgba(accentColor, 0.1)} 0%, rgba(255, 255, 255, 0.96) 68%)`,
  } as CSSProperties
  return (
    <article style={cardStyle} className="admin-company-card rounded-lg border border-[#ddd6ca] p-2.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--company-accent-border)] hover:shadow-[0_3px_8px_rgba(23,32,45,0.07)]">
      <div className="flex min-w-0 items-start gap-2">
        <CompanyLogo company={company} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="truncate text-[14px] font-semibold text-[#17202d]">{company.name}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${company.status === 'active' ? 'bg-[#e7f0ea] text-[#235b3e]' : 'bg-stone-100 text-stone-600'}`}>
              {company.status === 'active' ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          {company.description && <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-600">{company.description}</p>}
        </div>
      </div>
      <dl className="mt-2 grid gap-x-3 gap-y-1.5 border-t border-[#eee8dd] pt-2 text-[12px] md:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Qué ofrece</dt>
          <dd className="mt-0.5 line-clamp-1 text-slate-700">{company.offer_summary || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Cliente ideal</dt>
          <dd className="mt-0.5 line-clamp-1 text-slate-700">{company.ideal_customer || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Territorio</dt>
          <dd className="mt-0.5 truncate text-slate-700">{company.territory || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">Industrias</dt>
          <dd className="mt-0.5 line-clamp-1 text-slate-700">{formatList(company.target_industries)}</dd>
        </div>
      </dl>
      <div className="admin-company-actions mt-2 flex flex-wrap gap-1.5">
        <Link to={`/admin/empresas/${company.id}`} className="rounded-md border border-[#c9c1b4] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#17202d] transition hover:border-[#235b3e] hover:bg-[#fbfaf7]">
          Ver
        </Link>
        {canEdit && (
          <button type="button" onClick={() => onEdit?.(company)} className="rounded-md bg-[#235b3e] px-2.5 py-1 text-[12px] font-semibold text-white transition hover:bg-[#1b4732]">
            Editar
          </button>
        )}
      </div>
    </article>
  )
}

function CompanyForm({ initial, onSubmit, submitting }: { initial: RepresentedCompanyFormValues; onSubmit: (values: RepresentedCompanyFormValues, logoFile: File | null) => void; submitting: boolean }) {
  const [values, setValues] = useState(initial)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [candidates, setCandidates] = useState<Array<{ url: string; label: string; source: string }>>([])
  const [message, setMessage] = useState('')

  useEffect(() => setValues(initial), [initial])

  function update(field: keyof RepresentedCompanyFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setLogoFile(file)
    setMessage('')
  }

  async function detectLogo() {
    setDetecting(true)
    setMessage('')
    const result = await adminRepository.detectCompanyLogos(values.website_url)
    setDetecting(false)
    if (result.error) setMessage(result.error)
    setCandidates(result.data)
    if (!result.error && result.data.length === 0) setMessage('No se encontraron candidatos de logo.')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit(values, logoFile)
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Nombre
          <input value={values.name} onChange={(event) => update('name', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Slug
          <input value={values.slug} onChange={(event) => update('slug', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">Descripción
        <textarea value={values.description} onChange={(event) => update('description', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
      </label>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Sitio web
          <input type="url" value={values.website_url} onChange={(event) => update('website_url', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" placeholder="https://empresa.cl" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Estado
          <select value={values.status} onChange={(event) => update('status', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]">
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
          </select>
        </label>
      </div>
      <div className="rounded-xl border border-[#ddd6ca] bg-[#fbfaf7] p-4">
        <p className="text-sm font-semibold text-[#17202d]">Logo</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#c9c1b4] bg-white px-3 py-2 text-sm font-semibold text-[#17202d]">
            <Upload size={16} /> Subir logo
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoUpload} />
          </label>
          <button type="button" onClick={detectLogo} disabled={detecting || !values.website_url.trim()} className="inline-flex items-center gap-2 rounded-md border border-[#c9c1b4] bg-white px-3 py-2 text-sm font-semibold text-[#17202d] disabled:opacity-50">
            <LinkIcon size={16} /> {detecting ? 'Detectando...' : 'Detectar desde sitio web'}
          </button>
        </div>
        {logoFile && <p className="mt-2 text-sm text-slate-600">Logo seleccionado: {logoFile.name}. Se subirá después de guardar la empresa.</p>}
        {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        {candidates.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {candidates.map((candidate) => (
              <button key={candidate.url} type="button" onClick={() => setValues((current) => ({ ...current, logo_storage_path: `__detected__:${candidate.url}`, logo_source: 'detected' }))} className="flex items-center gap-3 rounded-md border border-[#ddd6ca] bg-white p-3 text-left hover:border-[#235b3e]">
                <img src={candidate.url} alt="" className="h-12 w-12 rounded-md object-contain" />
                <span className="min-w-0 text-sm">
                  <span className="block font-semibold text-[#17202d]">{candidate.label}</span>
                  <span className="block truncate text-slate-500">Usar este logo</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Qué ofrece
          <textarea value={values.offer_summary} onChange={(event) => update('offer_summary', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Cliente ideal
          <textarea value={values.ideal_customer} onChange={(event) => update('ideal_customer', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">Problema que resuelve
        <textarea value={values.problem_solved} onChange={(event) => update('problem_solved', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">Industrias
          <input value={values.target_industries} onChange={(event) => update('target_industries', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Territorio
          <input value={values.territory} onChange={(event) => update('territory', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">Palabras clave
          <input value={values.keywords} onChange={(event) => update('keywords', event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">Ejemplos de oportunidades
        <textarea value={values.opportunity_examples} onChange={(event) => update('opportunity_examples', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">Qué no prometer
        <textarea value={values.what_not_to_promise} onChange={(event) => update('what_not_to_promise', event.target.value)} rows={3} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
      </label>
      <button type="submit" disabled={submitting} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {submitting ? 'Guardando...' : 'Guardar empresa'}
      </button>
    </form>
  )
}

export function RedComercialHome() {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [data, setData] = useState<RedComercialHomeData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminRepository.getRedComercialHomeData().then((result) => {
      setData(result.data)
      setError(result.error ?? '')
    })
  }, [])

  return (
    <div className="grid gap-3">
      <AdminPageHeader eyebrow="ARISTA" title="Red Comercial Arista" text="Base comercial para empresas representadas, carteras y asignaciones." />
      {error && <ErrorBlock text={error} />}
      {!data ? <LoadingBlock /> : (
        <>
          <div className="grid gap-2 md:grid-cols-3">
            {admin ? (
              <>
                <MetricCard label="Empresas representadas" value={data.representedCompanies} icon={Building2} />
                <MetricCard label="Colaboradores activos" value={data.activeCollaborators} icon={Users} />
                <MetricCard label="Asignaciones activas" value={data.activeMemberships} icon={LinkIcon} />
              </>
            ) : (
              <>
                <MetricCard label="Mis carteras" value={data.myCompanies.length} icon={Building2} />
                <MetricCard label="Empresas Arista disponibles" value={data.representedCompanies} icon={Building2} />
              </>
            )}
          </div>
          {!admin && (
            <section className="rounded-lg border border-[#ddd6ca] bg-white p-3 shadow-[0_1px_2px_rgba(23,32,45,0.025)]">
              <h2 className="text-base font-semibold text-[#17202d]">Mis empresas</h2>
              <div className="mt-2 grid gap-1.5">
                {data.myCompanies.length === 0 ? <p className="text-sm text-slate-600">Aún no tienes carteras asignadas.</p> : data.myCompanies.map((company) => (
                  <Link key={company.id} to={`/admin/empresas/${company.id}`} className="flex items-center gap-2.5 rounded-md border border-[#eee8dd] p-2.5 transition hover:border-[#235b3e] hover:bg-[#fbfaf7]">
                    <CompanyLogo company={company} size="sm" />
                    <span className="font-semibold text-[#17202d]">{company.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export function AdminCompaniesPage() {
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<RepresentedCompanyRecord | 'new' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    const result = await adminRepository.listRepresentedCompanies()
    setCompanies(result.data)
    setError(result.error ?? '')
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function save(values: RepresentedCompanyFormValues, logoFile: File | null) {
    setSubmitting(true)
    const detectedUrl = values.logo_storage_path.startsWith('__detected__:') ? values.logo_storage_path.replace('__detected__:', '') : null
    const cleanValues = detectedUrl ? { ...values, logo_storage_path: '', logo_source: 'fallback' as const } : values
    const result = editing === 'new' ? await adminRepository.createRepresentedCompany(cleanValues) : await adminRepository.updateRepresentedCompany(editing!.id, cleanValues)
    if (result.data && detectedUrl) {
      const imported = await adminRepository.importDetectedCompanyLogo(result.data.id, detectedUrl)
      if (imported.data) await adminRepository.updateRepresentedCompany(result.data.id, { ...toForm(result.data), logo_storage_path: imported.data, logo_source: 'detected' })
    }
    if (result.data && logoFile) {
      const uploaded = await adminRepository.uploadCompanyLogo(result.data.id, logoFile)
      if (uploaded.data) await adminRepository.updateRepresentedCompany(result.data.id, { ...toForm(result.data), logo_storage_path: uploaded.data, logo_source: 'manual' })
    }
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEditing(null)
    await load()
  }

  return (
    <div className="grid gap-3">
      <AdminPageHeader eyebrow="Red Comercial" title="Empresas Arista" text="Empresas representadas y portafolio comercial de Arista." actionLabel={admin ? '+ Nueva empresa' : undefined} onAction={() => setEditing('new')} />
      {error && <ErrorBlock text={error} />}
      {loading ? <LoadingBlock /> : companies.length === 0 ? <EmptyState title="No hay empresas representadas todavía." text={admin ? 'Crea la primera empresa para iniciar el portafolio comercial.' : 'No hay empresas disponibles.'} /> : (
        <div className="grid min-w-0 gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
          {companies.map((company) => <CompanyCard key={company.id} company={company} canEdit={admin} onEdit={setEditing} />)}
        </div>
      )}
      {editing && (
        <AdminDetailModal title={editing === 'new' ? 'Nueva empresa' : `Editar ${editing.name}`} onClose={() => setEditing(null)} size="large">
          <CompanyForm initial={editing === 'new' ? emptyCompanyForm : toForm(editing)} onSubmit={save} submitting={submitting} />
        </AdminDetailModal>
      )}
    </div>
  )
}

type CompanyWorkspaceTab = 'summary' | 'offer' | 'ideal' | 'selling' | 'faq' | 'materials' | 'private'

const workspaceTabs: Array<{ key: CompanyWorkspaceTab; label: string; adminOnly?: boolean }> = [
  { key: 'summary', label: 'Resumen' },
  { key: 'offer', label: 'Oferta' },
  { key: 'ideal', label: 'Cliente ideal' },
  { key: 'selling', label: 'Como vender' },
  { key: 'faq', label: 'FAQ / Objeciones' },
  { key: 'materials', label: 'Materiales' },
  { key: 'private', label: 'Privado Arista', adminOnly: true },
]

const workspaceEditFields: Record<string, Array<{ key: string; label: string }>> = {
  offer: [
    { key: 'value_proposition', label: 'Propuesta de valor' }, { key: 'sales_offerings', label: 'Productos / servicios' },
    { key: 'modalities', label: 'Modalidades' }, { key: 'plans', label: 'Planes' }, { key: 'inclusions', label: 'Que incluye' },
    { key: 'exclusions', label: 'Que no incluye' }, { key: 'use_cases', label: 'Casos de uso' }, { key: 'recurring_model', label: 'Recurrencia' },
  ],
  ideal: [
    { key: 'buyer_roles', label: 'Cargos / buyer persona' }, { key: 'decision_makers', label: 'Quien decide' },
    { key: 'influencers', label: 'Quien influye' }, { key: 'needs', label: 'Necesidades tipicas' },
    { key: 'intent_signals', label: 'Senales de intencion' }, { key: 'qualification_criteria', label: 'Criterios de calificacion' },
    { key: 'disqualification_criteria', label: 'Criterios de descarte / mal fit' },
  ],
  selling: [
    { key: 'short_pitch', label: 'Pitch corto' }, { key: 'introduction_guidance', label: 'Presentacion inicial' },
    { key: 'discovery_questions', label: 'Preguntas de descubrimiento' }, { key: 'sales_process', label: 'Proceso comercial recomendado' },
    { key: 'required_information', label: 'Informacion necesaria' }, { key: 'material_guidance', label: 'Como presentar material' },
    { key: 'recommended_next_step', label: 'Proximo paso recomendado' }, { key: 'sales_plan', label: 'Plan comercial' },
  ],
  signals: [
    { key: 'opportunity_triggers', label: 'Cuando pensar en esta empresa' }, { key: 'cross_sell_use_cases', label: 'Oportunidades tipicas' },
  ],
}

function workspaceText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'No hay informacion cargada todavia.'
}

function workspaceLines(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').join('\n') : ''
}

function playbookItems(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim())
  return typeof value === 'string' ? splitCommercialItems(value) : []
}

function PlaybookNumberedList({ items }: { items: string[] }) {
  return items.length ? <ol className="grid gap-1.5">{items.map((item, index) => <li key={`${index}-${item}`} className="flex items-start gap-2 border-b border-black/[0.045] py-1.5 last:border-0"><span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e7f0ea] text-[10px] font-bold text-[#235b3e]">{index + 1}</span><span>{item}</span></li>)}</ol> : <p className="text-slate-500">Sin información cargada.</p>
}

function WorkspaceEditModal({ title, fields, initial, onClose, onSave, saving }: { title: string; fields: Array<{ key: string; label: string }>; initial: Record<string, unknown>; onClose: () => void; onSave: (payload: Record<string, unknown>) => void; saving: boolean }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(({ key }) => [key, Array.isArray(initial[key]) ? workspaceLines(initial[key]) : String(initial[key] ?? '')])))
  const arrayKeys = new Set(['discovery_questions', 'opportunity_triggers', 'cross_sell_use_cases'])
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, arrayKeys.has(key) ? value.split('\n').map((item) => item.trim()).filter(Boolean) : value]))
    onSave(payload)
  }
  return <AdminDetailModal title={title} onClose={onClose} size="large"><form className="grid gap-3" onSubmit={submit}>
    <div className="grid gap-3 md:grid-cols-2">{fields.map((field) => <label key={field.key} className="grid gap-1 text-[12px] font-semibold text-slate-700 md:last:col-span-2"><span>{field.label}</span><textarea rows={field.key.includes('questions') || field.key.includes('triggers') || field.key.includes('use_cases') ? 4 : 3} value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[13px] font-normal outline-none focus:border-[#235b3e]" placeholder={field.key.includes('questions') || field.key.includes('triggers') || field.key.includes('use_cases') ? 'Una linea por elemento' : ''} /></label>)}</div>
    <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-1.5 text-[12px] font-semibold">Cancelar</button><button type="submit" disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar seccion'}</button></div>
  </form></AdminDetailModal>
}

function FaqEditModal({ initial, onClose, onSave, saving }: { initial: Partial<RepresentedCompanyFaqRecord>; onClose: () => void; onSave: (values: Partial<RepresentedCompanyFaqRecord>) => void; saving: boolean }) {
  const [values, setValues] = useState({ type: initial.type ?? 'faq', question: initial.question ?? '', answer: initial.answer ?? '', requires_escalation: initial.requires_escalation ?? false })
  return <AdminDetailModal title={initial.id ? 'Editar FAQ / objecion' : 'Nueva FAQ / objecion'} onClose={onClose}><form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave(values) }}><label className="grid gap-1 text-[12px] font-semibold text-slate-700">Tipo<select value={values.type} onChange={(event) => setValues((current) => ({ ...current, type: event.target.value as 'faq' | 'objection' }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[13px] font-normal"><option value="faq">FAQ</option><option value="objection">Objecion</option></select></label><label className="grid gap-1 text-[12px] font-semibold text-slate-700">Pregunta<textarea required rows={2} value={values.question} onChange={(event) => setValues((current) => ({ ...current, question: event.target.value }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[13px] font-normal" /></label><label className="grid gap-1 text-[12px] font-semibold text-slate-700">Respuesta autorizada<textarea required rows={5} value={values.answer} onChange={(event) => setValues((current) => ({ ...current, answer: event.target.value }))} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[13px] font-normal" /></label><label className="flex items-center gap-2 text-[12px] font-semibold text-slate-700"><input type="checkbox" checked={values.requires_escalation} onChange={(event) => setValues((current) => ({ ...current, requires_escalation: event.target.checked }))} /> Requiere escalar a empresa representada</label><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-1.5 text-[12px] font-semibold">Cancelar</button><button type="submit" disabled={saving} className="rounded-md bg-[#235b3e] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : 'Guardar'}</button></div></form></AdminDetailModal>
}

function CompanySummaryRail({ workspace, company, admin, onTab, onMaterialView, onMaterialDownload }: { workspace: RedComercialCompanyWorkspace; company: RepresentedCompanyRecord; admin: boolean; onTab: (tab: CompanyWorkspaceTab) => void; onMaterialView: (material: RedComercialCompanyWorkspace['materials'][number]) => void; onMaterialDownload: (material: RedComercialCompanyWorkspace['materials'][number]) => void }) {
  const playbook = workspace.playbook as Record<string, unknown>
  const offerText = typeof playbook.sales_offerings === 'string' ? playbook.sales_offerings : company.offer_summary
  const offerings = extractCommercialItems(offerText)
  const idealText = company.ideal_customer
  const ideal = extractCommercialItems(idealText)
  const problems = extractProblemItems(company.problem_solved)
  const signals = [...company.opportunity_examples.flatMap((item) => splitCommercialItems(item)), ...((playbook.opportunity_triggers as string[] | undefined) ?? []).flatMap((item) => splitCommercialItems(item))]
  const useCases = ((playbook.cross_sell_use_cases as string[] | undefined) ?? []).flatMap((item) => splitCommercialItems(item))
  const pitch: string = workspaceText(playbook.short_pitch ?? playbook.value_proposition ?? company.offer_summary)
  const firstQuestion = extractFirstQuestion(playbook.discovery_questions)
  const privateValues = [workspace.private_details?.agreed_commission, workspace.private_details?.economic_terms, workspace.private_details?.sensitive_notes]
  const hasPrivateDetails = privateValues.some((value) => typeof value === 'string' && value.trim())

  const summary = <IntelligenceSection title="Resumen de la empresa" icon={Building2} tone="info"><p className="line-clamp-5 max-w-3xl">{workspaceText(company.description)}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-slate-500"><span>{company.territory || 'Territorio sin definir'}</span><span>{formatList(company.target_industries) || 'Industrias sin definir'}</span><span>{workspace.is_assigned ? 'Cartera asignada' : 'Directorio general'}</span></div></IntelligenceSection>
  const idealBlock = <IntelligenceSection title="Cliente ideal" icon={Users} tone="neutral"><p className="line-clamp-4">{workspaceText(idealText)}</p>{ideal.length > 1 && <CompanyWorkspaceChips items={ideal} limit={5} />}</IntelligenceSection>
  const privateBlock = admin && <IntelligenceSection title="Privado Arista" icon={LockKeyhole} tone="private">{hasPrivateDetails ? <div className="grid gap-x-5 gap-y-2 md:grid-cols-3"><p><span className="font-semibold">Comisión:</span><br />{workspaceText(workspace.private_details?.agreed_commission)}</p><p><span className="font-semibold">Términos:</span><br />{workspaceText(workspace.private_details?.economic_terms)}</p><p><span className="font-semibold">Notas internas:</span><br />{workspaceText(workspace.private_details?.sensitive_notes)}</p></div> : <div className="flex flex-wrap items-center justify-between gap-2"><p>Sin información privada registrada.</p><button type="button" onClick={() => onTab('private')} className="text-[10px] font-semibold text-[#235b3e]">Editar</button></div>}</IntelligenceSection>

  return <div className="grid items-start gap-2.5 lg:grid-cols-12">
    <div className="grid items-start gap-2.5 lg:col-span-12 lg:grid-cols-12"><div className="lg:col-span-8">{summary}</div><div className="lg:col-span-4">{idealBlock}</div></div>
    <div className="grid items-start gap-2.5 lg:col-span-12 lg:grid-cols-2">
      <div className="grid content-start gap-2.5">
        <IntelligenceSection title="Qué vende" icon={FileText} tone="positive">{offerings.length ? <CompanyWorkspaceChips items={offerings} limit={10} /> : <p className="line-clamp-4 text-[12px]">{workspaceText(offerText)}</p>}</IntelligenceSection>
        <IntelligenceSection title="Propuesta de valor" icon={Star} tone="positive"><p className="line-clamp-4">{workspaceText(playbook.value_proposition ?? company.offer_summary)}</p></IntelligenceSection>
        <IntelligenceSection title="Cómo abordarla" icon={ArrowRight} tone="info"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">Guion breve</p><p className="mt-1 line-clamp-4">{pitch}</p>{firstQuestion && <p className="mt-2 line-clamp-2 text-[11px] text-slate-600"><strong>Pregunta inicial:</strong> {firstQuestion}</p>}<button type="button" onClick={() => onTab('selling')} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#235b3e]">Ver preguntas sugeridas <ArrowRight size={12} /></button></IntelligenceSection>
        <IntelligenceSection title="Materiales principales" icon={FileText} tone="neutral"><CompanyWorkspaceMaterialList materials={workspace.materials} onView={onMaterialView} onDownload={onMaterialDownload} onMore={() => onTab('materials')} /></IntelligenceSection>
        <IntelligenceSection title="FAQ / objeciones destacadas" icon={FileText} tone="neutral"><CompanyWorkspaceFaqList faqs={workspace.faqs} /><button type="button" onClick={() => onTab('faq')} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#235b3e]">Ver todas <ArrowRight size={12} /></button></IntelligenceSection>
      </div>
      <div className="grid content-start gap-2.5">
        <IntelligenceSection title="Dolores que resuelve" icon={AlertTriangle} tone="danger"><CompanyWorkspaceList items={problems} icon="alert" tone="danger" limit={8} /></IntelligenceSection>
        <IntelligenceSection title="Señales de oportunidad" icon={Radar} tone="attention"><CompanyWorkspaceList items={signals} tone="attention" limit={8} /></IntelligenceSection>
        <IntelligenceSection title="Oportunidades típicas" icon={Target} tone="neutral"><CompanyWorkspaceList items={useCases} icon="arrow" limit={8} /></IntelligenceSection>
        <IntelligenceSection title="Palabras clave" icon={Target} tone="neutral"><CompanyWorkspaceChips items={company.keywords} limit={12} /></IntelligenceSection>
      </div>
    </div>
    <div className="lg:col-span-12">{privateBlock}</div>
  </div>
}

export function CompanyDetailPage() {
  const { id } = useParams()
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)
  const [workspace, setWorkspace] = useState<RedComercialCompanyWorkspace | null>(null)
  const [tab, setTab] = useState<CompanyWorkspaceTab>('summary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [faqEditing, setFaqEditing] = useState<Partial<RepresentedCompanyFaqRecord> | null>(null)
  const [saving, setSaving] = useState(false)
  const playbook = (workspace?.playbook ?? {}) as Record<string, unknown>

  const load = useCallback(async (background = false): Promise<string | null> => {
    if (!isUuid(id)) {
      if (!background) setError('La empresa indicada en la URL no es valida.')
      if (!background) setLoading(false)
      return 'La empresa indicada en la URL no es valida.'
    }
    if (!background) setLoading(true)
    const result = await adminRepository.getRedComercialCompanyWorkspace(id)
    if (result.error) {
      if (!background) { setWorkspace(result.data); setError(result.error) }
      if (!background) setLoading(false)
      return result.error
    }
    setWorkspace(result.data)
    setError('')
    if (!background) setLoading(false)
    return null
  }, [id])
  useEffect(() => { void load() }, [load])

  async function saveSection(section: string, payload: Record<string, unknown>) {
    if (!id) return
    setSaving(true)
    const result = await adminRepository.updateRedComercialCompanyPlaybook(id, section, payload)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setWorkspace(result.data)
    setEditing(null)
  }

  async function saveFaq(values: Partial<RepresentedCompanyFaqRecord>) {
    if (!id) return
    setSaving(true)
    const result = await adminRepository.upsertRedComercialCompanyFaq(id, { ...values, id: faqEditing?.id })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setFaqEditing(null)
    await load()
  }

  if (loading) return <LoadingBlock text="Cargando playbook comercial..." />
  if (error) return <ErrorBlock text={error} />
  if (!workspace) return <EmptyState title="Empresa no encontrada" text="No fue posible encontrar la empresa solicitada." />
  const company = workspace.company
  const visibleTabs = workspaceTabs.filter((item) => !item.adminOnly || admin)
  const editFields = editing ? workspaceEditFields[editing] ?? [] : []
  async function downloadSummaryMaterial(material: RedComercialCompanyWorkspace['materials'][number]) {
    if (material.material_type === 'link') {
      window.open(material.external_url ?? '', '_blank', 'noopener,noreferrer')
      return
    }
    const result = await adminRepository.createRepresentedCompanyMaterialSignedUrl(material.id)
    if (result.error || !result.data) return
    const anchor = document.createElement('a')
    anchor.href = result.data
    anchor.download = material.file_name ?? material.title
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }
  return <div className="grid gap-2">
    <section className="rounded-lg border border-[#ddd6ca] bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)]"><div className="grid items-center gap-x-3 gap-y-1.5 md:grid-cols-[auto_minmax(0,1fr)_auto]"><div className="flex items-center gap-2"><Link to="/admin/empresas" className="mr-1 text-[11px] font-semibold text-[#235b3e]">Volver</Link><CompanyLogo company={company} size="sm" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><h1 className="truncate text-[17px] font-semibold text-[#17202d]">{company.name}</h1><span className="rounded-full bg-[#e7f0ea] px-1.5 py-0.5 text-[10px] font-semibold text-[#235b3e]">{company.status === 'active' ? 'Activa' : 'Inactiva'}</span></div><p className="line-clamp-2 text-[11px] leading-4 text-slate-600">{workspaceText(company.description)}</p></div><div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 md:justify-end">{company.website_url && <a href={company.website_url} target="_blank" rel="noreferrer" className="font-semibold text-[#235b3e]">Sitio web</a>}<span>{company.territory || 'Territorio sin definir'}</span><span>{workspace.is_assigned ? 'Cartera asignada' : 'Directorio general'}</span>{admin && <div className="flex flex-wrap items-center gap-1.5 md:col-start-3"><button type="button" onClick={() => setEditing('offer')} className="rounded-md border border-[#c9c1b4] px-2 py-1 text-[10px] font-semibold text-[#17202d]">Editar</button><button type="button" onClick={() => setTab('materials')} className="rounded-md border border-[#c9c1b4] px-2 py-1 text-[10px] font-semibold text-[#235b3e]">Agregar material</button><button type="button" onClick={() => setTab('faq')} className="rounded-md bg-[#235b3e] px-2 py-1 text-[10px] font-semibold text-white">Nueva FAQ</button></div>}</div></div></section>
    <nav className="flex min-w-0 gap-0.5 overflow-x-auto rounded-lg border border-[#ddd6ca] bg-[#fbfaf7] p-0.5">{visibleTabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold transition ${tab === item.key ? 'bg-white text-[#235b3e] shadow-sm' : 'text-slate-500 hover:text-[#17202d]'}`}>{item.label}</button>)}</nav>
    {tab === 'offer' && <div className="grid items-start gap-2.5 lg:grid-cols-2"><div className="grid content-start gap-2.5"><IntelligenceSection title="Qué vendemos" icon={FileText} tone="positive" canEdit={admin} onEdit={() => setEditing('offer')}>{extractCommercialItems(typeof playbook.sales_offerings === 'string' ? playbook.sales_offerings : company.offer_summary).length ? <CompanyWorkspaceChips items={extractCommercialItems(typeof playbook.sales_offerings === 'string' ? playbook.sales_offerings : company.offer_summary)} limit={12} /> : <p className="line-clamp-4">{workspaceText(playbook.sales_offerings ?? company.offer_summary)}</p>}</IntelligenceSection><IntelligenceSection title="Modalidades" icon={Layers} tone="neutral" canEdit={admin} onEdit={() => setEditing('offer')}><CompanyWorkspaceList items={playbookItems(playbook.modalities)} limit={8} /></IntelligenceSection><IntelligenceSection title="Incluye / no incluye" icon={CheckCircle2} tone="positive" canEdit={admin} onEdit={() => setEditing('offer')}><div className="grid gap-2 md:grid-cols-2"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Incluye</p><CompanyWorkspaceList items={playbookItems(playbook.inclusions)} icon="check" limit={8} /></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">No incluye</p><CompanyWorkspaceList items={playbookItems(playbook.exclusions)} icon="alert" tone="danger" limit={8} /></div></div></IntelligenceSection><IntelligenceSection title="Límites comerciales" icon={AlertTriangle} tone="attention"><p className="line-clamp-4">{company.what_not_to_promise || workspaceText(playbook.exclusions)}</p></IntelligenceSection></div><div className="grid content-start gap-2.5"><IntelligenceSection title="Propuesta de valor" icon={Star} tone="positive"><p className="line-clamp-4">{workspaceText(playbook.value_proposition)}</p></IntelligenceSection><IntelligenceSection title="Planes y recurrencia" icon={RefreshCcw} tone="info" canEdit={admin} onEdit={() => setEditing('offer')}><p>{workspaceText(playbook.plans)}</p><p className="mt-2 text-[11px] font-semibold text-slate-600">{workspaceText(playbook.recurring_model)}</p></IntelligenceSection><IntelligenceSection title="Casos de uso" icon={Target} tone="neutral" canEdit={admin} onEdit={() => setEditing('offer')}><CompanyWorkspaceList items={playbookItems(playbook.use_cases)} icon="arrow" limit={8} /></IntelligenceSection></div></div>}
    {tab === 'ideal' && <div className="grid items-start gap-2.5 lg:grid-cols-2"><div className="grid content-start gap-2.5"><IntelligenceSection title="Perfil cliente ideal" icon={Users} tone="info"><p className="line-clamp-5">{workspaceText(company.ideal_customer)}</p></IntelligenceSection><IntelligenceSection title="Cargos y decisores" icon={Users} tone="neutral" canEdit={admin} onEdit={() => setEditing('ideal')}><div className="grid gap-1.5"><p><strong>Decide:</strong> {workspaceText(playbook.decision_makers)}</p><p><strong>Influye:</strong> {workspaceText(playbook.influencers)}</p><p><strong>Usuario:</strong> {workspaceText(playbook.buyer_roles)}</p></div></IntelligenceSection><IntelligenceSection title="Calificación" icon={CheckCircle2} tone="positive" canEdit={admin} onEdit={() => setEditing('ideal')}><div className="grid gap-2 md:grid-cols-2"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Buen fit</p><p className="line-clamp-4">{workspaceText(playbook.qualification_criteria)}</p></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-rose-700">No es buen fit</p><p className="line-clamp-4">{workspaceText(playbook.disqualification_criteria)}</p></div></div></IntelligenceSection></div><div className="grid content-start gap-2.5"><IntelligenceSection title="Industrias y territorio" icon={Building2} tone="neutral"><CompanyWorkspaceChips items={company.target_industries} limit={10} /><p className="mt-2 text-[11px] font-semibold text-slate-600">{company.territory || 'Territorio sin definir'}</p></IntelligenceSection><IntelligenceSection title="Necesidades y señales" icon={Radar} tone="attention" canEdit={admin} onEdit={() => setEditing('ideal')}><div className="grid gap-2"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Necesidades</p><CompanyWorkspaceList items={playbookItems(playbook.needs)} limit={8} /></div><div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">Señales</p><CompanyWorkspaceList items={playbookItems(playbook.intent_signals)} tone="attention" limit={8} /></div></div></IntelligenceSection></div></div>}
    {tab === 'selling' && <div className="grid items-start gap-2.5 lg:grid-cols-2"><div className="grid content-start gap-2.5"><IntelligenceSection title="Pitch corto" icon={Star} tone="info" canEdit={admin} onEdit={() => setEditing('selling')}><p className="line-clamp-5">{workspaceText(playbook.short_pitch)}</p></IntelligenceSection><IntelligenceSection title="Preguntas de descubrimiento" icon={Users} tone="neutral" canEdit={admin} onEdit={() => setEditing('selling')}><PlaybookNumberedList items={playbookItems(playbook.discovery_questions)} /></IntelligenceSection><IntelligenceSection title="Plan comercial" icon={Target} tone="positive" canEdit={admin} onEdit={() => setEditing('selling')}><p className="line-clamp-6">{workspaceText(playbook.sales_plan)}</p></IntelligenceSection></div><div className="grid content-start gap-2.5"><IntelligenceSection title="Presentación inicial" icon={ArrowRight} tone="neutral" canEdit={admin} onEdit={() => setEditing('selling')}><p className="line-clamp-6">{workspaceText(playbook.introduction_guidance)}</p></IntelligenceSection><IntelligenceSection title="Proceso comercial recomendado" icon={Layers} tone="info" canEdit={admin} onEdit={() => setEditing('selling')}><PlaybookNumberedList items={playbookItems(playbook.sales_process)} /></IntelligenceSection><IntelligenceSection title="Siguiente paso" icon={CheckCircle2} tone="positive" canEdit={admin} onEdit={() => setEditing('selling')}><p className="line-clamp-5">{workspaceText(playbook.recommended_next_step)}</p></IntelligenceSection></div></div>}
    {tab === 'faq' && <div className="grid items-start gap-2.5 lg:grid-cols-2">{workspace.faqs.length === 0 ? <EmptyState title={workspace.is_assigned || admin ? 'No hay FAQ u objeciones cargadas.' : 'Contenido operativo restringido'} text={workspace.is_assigned || admin ? 'Agrega respuestas autorizadas para ayudar a la red comercial.' : 'Asigna esta empresa a tu cartera para ver el playbook de venta.'} /> : workspace.faqs.map((faq) => <details key={faq.id} className={'rounded-[10px] border p-3.5 shadow-[0_1px_2px_rgba(23,32,45,0.025)] ' + (faq.type === 'objection' ? 'border-[#f0e3c4] bg-[#fffaf0]' : 'border-[#dbeade] bg-[#f4faf6]')}><summary className="flex cursor-pointer list-none items-center gap-2"><span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#235b3e]">{faq.type === 'objection' ? 'Objeción' : 'FAQ'}</span><span className="min-w-0 flex-1 font-semibold text-[#17202d]">{faq.question}</span><span className="text-[11px] text-slate-400">+</span></summary><div className="mt-2 border-t border-black/[0.06] pt-2"><p className="line-clamp-3 text-[12px] text-slate-700">{faq.answer}</p>{faq.requires_escalation && <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Consultar con representado</span>}{admin && <div className="mt-2"><button type="button" onClick={() => setFaqEditing(faq)} className="text-[10px] font-semibold text-[#235b3e]">Editar</button></div>}</div></details>)}{admin && <button type="button" onClick={() => setFaqEditing({ type: 'faq' })} className="w-fit rounded-md border border-[#c9c1b4] px-2.5 py-1.5 text-[11px] font-semibold text-[#235b3e]">+ Agregar FAQ / objeción</button>}</div>}
    {tab === 'materials' && <CompanyMaterialsPanel companyId={company.id} materials={workspace.materials} admin={admin} onReload={() => load(true)} />}
    {tab === 'private' && admin && <div className="grid items-start gap-2.5 lg:grid-cols-2"><IntelligenceSection title="Modelo de comisión" icon={LockKeyhole} tone="private"><p className="line-clamp-5">{workspaceText(workspace.private_details?.agreed_commission)}</p></IntelligenceSection><IntelligenceSection title="Condiciones contractuales" icon={LockKeyhole} tone="private"><p className="line-clamp-5">{workspaceText(workspace.private_details?.contract_notes)}</p></IntelligenceSection><IntelligenceSection title="Términos económicos" icon={LockKeyhole} tone="private"><p className="line-clamp-5">{workspaceText(workspace.private_details?.economic_terms)}</p></IntelligenceSection><IntelligenceSection title="Notas privadas Arista" icon={LockKeyhole} tone="private"><p className="line-clamp-6">{workspaceText(workspace.private_details?.sensitive_notes)}</p></IntelligenceSection></div>}
    {tab === 'summary' && <CompanySummaryRail workspace={workspace} company={company} admin={admin} onTab={setTab} onMaterialView={() => setTab('materials')} onMaterialDownload={(material) => void downloadSummaryMaterial(material)} />}
    <p className="text-right text-[10px] text-slate-400">Ultima actualizacion: {workspace.updated_at ? companyDate(workspace.updated_at) : 'Sin fecha'}</p>
    {editing && <WorkspaceEditModal title={`Editar ${editing}`} fields={editFields} initial={playbook} onClose={() => setEditing(null)} onSave={(payload) => void saveSection(editing === 'signals' ? 'signals' : editing, payload)} saving={saving} />}
    {faqEditing && <FaqEditModal initial={faqEditing} onClose={() => setFaqEditing(null)} onSave={(values) => void saveFaq(values)} saving={saving} />}
  </div>
}

export function MyPortfoliosPage() {
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    adminRepository.listMyRepresentedCompanies().then((result) => {
      setCompanies(result.data)
      setError(result.error ?? '')
      setLoading(false)
    })
  }, [])
  return (
    <div className="grid gap-3">
      <AdminPageHeader eyebrow="Red Comercial" title="Mis carteras" text="Empresas representadas asociadas a tu gestión comercial." />
      {error && <ErrorBlock text={error} />}
      {loading ? <LoadingBlock /> : companies.length === 0 ? <EmptyState title="No tienes carteras asignadas." text="Cuando un administrador te asigne empresas, aparecerán en esta vista." /> : (
        <div className="grid gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">{companies.map((company) => <CompanyCard key={company.id} company={company} canEdit={false} />)}</div>
      )}
    </div>
  )
}

export function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deleting, setDeleting] = useState<CollaboratorRecord | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')

  async function load() {
    setLoading(true)
    const result = await adminRepository.listCollaborators()
    setCollaborators(result.data)
    setError(result.error ?? '')
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  async function invite(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    const result = await adminRepository.inviteCollaborator(email, fullName)
    if (result.error) setError(result.error)
    else {
      setMessage('Invitación enviada correctamente.')
      setInviteOpen(false)
      setEmail('')
      setFullName('')
      await load()
    }
  }

  async function toggle(collaborator: CollaboratorRecord) {
    setError('')
    setMessage('')
    const result = await adminRepository.updateCollaboratorStatus(collaborator.id, !collaborator.is_active)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage(collaborator.is_active ? 'Colaborador desactivado correctamente.' : 'Colaborador reactivado correctamente.')
    await load()
  }

  async function changeRole(collaborator: CollaboratorRecord, role: 'owner' | 'collaborator') {
    if (collaborator.role === role) return
    if (role === 'collaborator' && !window.confirm('Este usuario perderá acceso a Administración, solicitudes web y módulos internos. ¿Continuar?')) return
    setError('')
    setMessage('')
    const result = await adminRepository.updateRedComercialUserRole(collaborator.id, role)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage('Rol actualizado correctamente.')
    await load()
  }

  async function reissue(collaborator: CollaboratorRecord) {
    setError('')
    setMessage('')
    const result = await adminRepository.reissueCollaboratorInvitation(collaborator.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage('Invitación reenviada correctamente.')
    await load()
  }

  async function revoke(collaborator: CollaboratorRecord) {
    setError('')
    setMessage('')
    const result = await adminRepository.revokeCollaboratorInvitation(collaborator.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage('Invitación revocada correctamente.')
    await load()
  }

  async function removePendingInvitation() {
    if (!deleting) return
    setError('')
    setMessage('')
    const result = await adminRepository.removeCollaboratorInvitation(deleting.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setMessage('Invitación eliminada correctamente.')
    setDeleting(null)
    await load()
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader eyebrow="Red Comercial" title="Colaboradores" text="Usuarios de la red comercial y su estado de acceso." actionLabel="+ Invitar colaborador" onAction={() => setInviteOpen(true)} />
      {error && <ErrorBlock text={error} />}
      {message && <div className="rounded-xl border border-[#b8d8c3] bg-[#eef7f1] px-4 py-3 text-sm text-[#235b3e]">{message}</div>}
      {loading ? <LoadingBlock /> : (
        <div className="overflow-hidden rounded-xl border border-[#ddd6ca] bg-white shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
          <table className="min-w-full divide-y divide-[#eee8dd] text-sm">
            <thead className="bg-[#fbfaf7] text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-[#eee8dd]">
              {collaborators.map((collaborator) => {
                const accepted = collaborator.role === 'owner' || (collaborator.invitation_status === 'accepted' && Boolean(collaborator.onboarding_completed_at))
                const pending = collaborator.role === 'collaborator' && !accepted && collaborator.invitation_status !== 'revoked'
                const revoked = collaborator.role === 'collaborator' && collaborator.invitation_status === 'revoked'
                const active = accepted && collaborator.is_active
                const statusLabel = pending ? 'Invitación pendiente' : revoked ? 'Invitación revocada' : active ? 'Activo' : 'Inactivo'
                const statusClass = pending
                  ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                  : revoked
                    ? 'bg-red-50 text-red-800 ring-1 ring-red-200'
                  : active
                    ? 'bg-[#e7f0ea] text-[#235b3e] ring-1 ring-[#c9dfd0]'
                    : 'bg-stone-100 text-stone-600 ring-1 ring-stone-200'

                return (
                  <tr key={collaborator.id}>
                    <td className="px-4 py-3 font-semibold text-[#17202d]">{collaborator.full_name || 'Sin nombre'}</td>
                    <td className="px-4 py-3 text-slate-600">{collaborator.email || 'Sin email registrado'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <select aria-label={`Rol de ${collaborator.full_name || collaborator.email || collaborator.id}`} value={collaborator.role} onChange={(event) => void changeRole(collaborator, event.target.value as 'owner' | 'collaborator')} className="rounded-md border border-[#c9c1b4] bg-white px-2 py-1.5 text-sm">
                        <option value="owner">Administrador</option>
                        <option value="collaborator">Colaborador</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td className="px-4 py-3">
                      {pending && (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => void reissue(collaborator)} className="rounded-md border border-[#c9c1b4] px-3 py-2 font-semibold text-[#17202d]">Reenviar</button>
                          <details className="relative">
                            <summary className="list-none rounded-md border border-[#c9c1b4] px-3 py-2 font-semibold text-[#17202d] marker:hidden">⋯</summary>
                            <div className="absolute right-0 z-10 mt-2 grid w-48 gap-1 rounded-lg border border-[#ddd6ca] bg-white p-2 shadow-lg">
                              <button type="button" onClick={() => void revoke(collaborator)} className="rounded-md px-3 py-2 text-left text-sm font-semibold text-[#17202d] hover:bg-[#fbfaf7]">Revocar invitación</button>
                              <button type="button" onClick={() => setDeleting(collaborator)} className="rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50">Eliminar invitación</button>
                            </div>
                          </details>
                        </div>
                      )}
                      {revoked && (
                        <button type="button" onClick={() => void reissue(collaborator)} className="rounded-md border border-[#c9c1b4] px-3 py-2 font-semibold text-[#17202d]">Reenviar</button>
                      )}
                      {collaborator.role === 'collaborator' && accepted && (
                        <button type="button" onClick={() => void toggle(collaborator)} className="rounded-md border border-[#c9c1b4] px-3 py-2 font-semibold text-[#17202d]">{collaborator.is_active ? 'Desactivar' : 'Reactivar'}</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {inviteOpen && (
        <AdminDetailModal title="Invitar colaborador" onClose={() => setInviteOpen(false)}>
          <form className="grid gap-4" onSubmit={invite}>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Nombre
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border border-[#c9c1b4] px-3 py-2.5 outline-none focus:border-[#235b3e]" required />
            </label>
            <button type="submit" className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">Enviar invitación</button>
          </form>
        </AdminDetailModal>
      )}
      {deleting && (
        <AdminDetailModal title="Eliminar invitación" onClose={() => setDeleting(null)}>
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-700">
              Se eliminará la invitación pendiente de {deleting.full_name || deleting.email || 'este colaborador'}.
              Esta acción sólo está disponible porque el usuario todavía no ha iniciado actividad en Red Comercial.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="rounded-md border border-[#c9c1b4] px-4 py-2 text-sm font-semibold text-[#17202d]">Cancelar</button>
              <button type="button" onClick={() => void removePendingInvitation()} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">Eliminar invitación</button>
            </div>
          </div>
        </AdminDetailModal>
      )}
    </div>
  )
}

export function AssignmentsPage() {
  const [companies, setCompanies] = useState<RepresentedCompanyRecord[]>([])
  const [collaborators, setCollaborators] = useState<CollaboratorRecord[]>([])
  const [memberships, setMemberships] = useState<RepresentedCompanyMembershipRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<RepresentedCompanyRecord | null>(null)
  const activeCollaborators = collaborators.filter((collaborator) => collaborator.role === 'collaborator' && collaborator.is_active)

  async function load() {
    setLoading(true)
    const [companyResult, collaboratorResult, membershipResult] = await Promise.all([
      adminRepository.listRepresentedCompanies(),
      adminRepository.listCollaborators(),
      adminRepository.listCompanyMemberships(),
    ])
    setCompanies(companyResult.data)
    setCollaborators(collaboratorResult.data)
    setMemberships(membershipResult.data)
    setError(companyResult.error ?? collaboratorResult.error ?? membershipResult.error ?? '')
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const membershipsByCompany = useMemo(() => {
    const map = new Map<string, RepresentedCompanyMembershipRecord[]>()
    memberships.filter((membership) => membership.status === 'active').forEach((membership) => {
      map.set(membership.represented_company_id, [...(map.get(membership.represented_company_id) ?? []), membership])
    })
    return map
  }, [memberships])

  async function toggle(companyId: string, userId: string, active: boolean) {
    const result = active ? await adminRepository.deactivateCompanyMembership(companyId, userId) : await adminRepository.upsertCompanyMembership(companyId, userId)
    if (result.error) setError(result.error)
    await load()
  }

  return (
    <div className="grid gap-5">
      <AdminPageHeader eyebrow="Red Comercial" title="Asignaciones" text="Relación entre empresas representadas y colaboradores con acceso activo." />
      {error && <ErrorBlock text={error} />}
      {loading ? <LoadingBlock /> : (
        <div className="grid gap-4">
          {companies.map((company) => {
            const assigned = membershipsByCompany.get(company.id) ?? []
            return (
              <article key={company.id} className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.03)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo company={company} size="sm" />
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-[#17202d]">{company.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {assigned.length === 0 ? 'Sin colaboradores asignados' : assigned.map((membership) => collaborators.find((item) => item.id === membership.user_id)?.full_name || collaborators.find((item) => item.id === membership.user_id)?.email || 'Colaborador').join(' · ')}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedCompany(company)} className="w-fit rounded-md bg-[#235b3e] px-3 py-2 text-sm font-semibold text-white">Asignar colaborador</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {selectedCompany && (
        <AdminDetailModal title={`Asignar ${selectedCompany.name}`} onClose={() => setSelectedCompany(null)}>
          <div className="grid gap-3">
            {activeCollaborators.length === 0 ? <p className="text-sm text-slate-600">No hay colaboradores activos.</p> : activeCollaborators.map((collaborator) => {
              const active = memberships.some((membership) => membership.represented_company_id === selectedCompany.id && membership.user_id === collaborator.id && membership.status === 'active')
              return (
                <div key={collaborator.id} className="flex items-center justify-between gap-4 rounded-md border border-[#eee8dd] p-3">
                  <div>
                    <p className="font-semibold text-[#17202d]">{collaborator.full_name || collaborator.email}</p>
                    <p className="text-sm text-slate-600">{collaborator.email}</p>
                  </div>
                  <button type="button" onClick={() => void toggle(selectedCompany.id, collaborator.id, active)} className="rounded-md border border-[#c9c1b4] px-3 py-2 text-sm font-semibold text-[#17202d]">
                    {active ? 'Quitar acceso' : 'Asignar'}
                  </button>
                </div>
              )
            })}
          </div>
        </AdminDetailModal>
      )}
    </div>
  )
}
