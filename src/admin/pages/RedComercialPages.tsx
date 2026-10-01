import { Building2, Link as LinkIcon, Upload, Users } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { CompanyLogo } from '../../components/admin/CompanyLogo'
import { EmptyState } from '../../components/admin/EmptyState'
import { adminRepository } from '../../repositories'
import type { CollaboratorRecord, RedComercialHomeData, RepresentedCompanyFormValues, RepresentedCompanyMembershipRecord, RepresentedCompanyRecord } from '../../types/admin'
import { formatList, isRedComercialAdmin } from '../red-comercial-utils'
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

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Building2 }) {
  return (
    <div className="min-h-[104px] rounded-xl border border-[#ddd6ca] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold leading-none text-[#17202d]">{value}</p>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f0ea] text-[#235b3e]">
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
    </div>
  )
}

function CompanyCard({ company, canEdit, onEdit }: { company: RepresentedCompanyRecord; canEdit: boolean; onEdit?: (company: RepresentedCompanyRecord) => void }) {
  return (
    <article className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
      <div className="flex min-w-0 items-start gap-3">
        <CompanyLogo company={company} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-[#17202d]">{company.name}</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${company.status === 'active' ? 'bg-[#e7f0ea] text-[#235b3e]' : 'bg-stone-100 text-stone-600'}`}>
              {company.status === 'active' ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          {company.description && <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-600">{company.description}</p>}
        </div>
      </div>
      <dl className="mt-4 grid gap-3 border-t border-[#eee8dd] pt-4 text-sm md:grid-cols-2">
        <div>
          <dt className="font-semibold text-[#17202d]">Qué ofrece</dt>
          <dd className="mt-1 line-clamp-2 text-slate-600">{company.offer_summary || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17202d]">Cliente ideal</dt>
          <dd className="mt-1 line-clamp-2 text-slate-600">{company.ideal_customer || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17202d]">Territorio</dt>
          <dd className="mt-1 text-slate-600">{company.territory || 'Sin definir'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[#17202d]">Industrias</dt>
          <dd className="mt-1 text-slate-600">{formatList(company.target_industries)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/admin/empresas/${company.id}`} className="rounded-lg border border-[#c9c1b4] bg-white px-3 py-2 text-sm font-semibold text-[#17202d] transition hover:border-[#235b3e] hover:bg-[#fbfaf7]">
          Ver
        </Link>
        {canEdit && (
          <button type="button" onClick={() => onEdit?.(company)} className="rounded-lg bg-[#235b3e] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#1b4732]">
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
    <div className="grid gap-5">
      <AdminPageHeader eyebrow="ARISTA" title="Red Comercial Arista" text="Base comercial para empresas representadas, carteras y asignaciones." />
      {error && <ErrorBlock text={error} />}
      {!data ? <LoadingBlock /> : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
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
            <section className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
              <h2 className="text-base font-semibold text-[#17202d]">Mis empresas</h2>
              <div className="mt-3 grid gap-2">
                {data.myCompanies.length === 0 ? <p className="text-sm text-slate-600">Aún no tienes carteras asignadas.</p> : data.myCompanies.map((company) => (
                  <Link key={company.id} to={`/admin/empresas/${company.id}`} className="flex items-center gap-3 rounded-lg border border-[#eee8dd] p-3 transition hover:border-[#235b3e] hover:bg-[#fbfaf7]">
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
    <div className="grid gap-5">
      <AdminPageHeader eyebrow="Red Comercial" title="Empresas Arista" text="Empresas representadas y portafolio comercial de Arista." actionLabel={admin ? '+ Nueva empresa' : undefined} onAction={() => setEditing('new')} />
      {error && <ErrorBlock text={error} />}
      {loading ? <LoadingBlock /> : companies.length === 0 ? <EmptyState title="No hay empresas representadas todavía." text={admin ? 'Crea la primera empresa para iniciar el portafolio comercial.' : 'No hay empresas disponibles.'} /> : (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
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

export function CompanyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [company, setCompany] = useState<RepresentedCompanyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    adminRepository.getRepresentedCompanyById(id).then((result) => {
      setCompany(result.data)
      setError(result.error ?? '')
      setLoading(false)
    })
  }, [id])

  if (loading) return <LoadingBlock />
  if (error) return <ErrorBlock text={error} />
  if (!company) return <EmptyState title="Empresa no encontrada" text="No fue posible encontrar la empresa solicitada." />

  return (
    <div className="grid gap-5">
      <button type="button" onClick={() => navigate(-1)} className="w-fit text-sm font-semibold text-[#235b3e]">Volver</button>
      <section className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.035)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <CompanyLogo company={company} size="lg" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#235b3e]">Empresa representada</p>
            <h1 className="mt-1.5 text-2xl font-semibold text-[#17202d]">{company.name}</h1>
            {company.website_url && <a href={company.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#235b3e]">{company.website_url}</a>}
            {company.description && <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{company.description}</p>}
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        {[
          ['Productos/servicios', company.offer_summary],
          ['Problema que resuelve', company.problem_solved],
          ['Cliente ideal', company.ideal_customer],
          ['Territorio', company.territory],
          ['Industrias', formatList(company.target_industries)],
          ['Palabras clave', formatList(company.keywords)],
          ['Qué no prometer', company.what_not_to_promise],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.03)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#235b3e]">{label}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">{value || 'Sin definir'}</p>
          </div>
        ))}
      </section>
      <section className="rounded-xl border border-[#ddd6ca] bg-white p-4 shadow-[0_1px_2px_rgba(23,32,45,0.03)]">
        <h2 className="text-base font-semibold text-[#17202d]">¿Cuándo es una oportunidad?</h2>
        {company.opportunity_examples.length === 0 ? <p className="mt-3 text-sm text-slate-600">Sin ejemplos definidos.</p> : (
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            {company.opportunity_examples.map((example) => <li key={example} className="rounded-md bg-[#fbfaf7] px-3 py-2">{example}</li>)}
          </ul>
        )}
      </section>
    </div>
  )
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
    <div className="grid gap-5">
      <AdminPageHeader eyebrow="Red Comercial" title="Mis carteras" text="Empresas representadas asociadas a tu gestión comercial." />
      {error && <ErrorBlock text={error} />}
      {loading ? <LoadingBlock /> : companies.length === 0 ? <EmptyState title="No tienes carteras asignadas." text="Cuando un administrador te asigne empresas, aparecerán en esta vista." /> : (
        <div className="grid gap-4 xl:grid-cols-2">{companies.map((company) => <CompanyCard key={company.id} company={company} canEdit={false} />)}</div>
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
                    <td className="px-4 py-3 text-slate-600">{collaborator.role === 'owner' ? 'Admin' : 'Colaborador'}</td>
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
