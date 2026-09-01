import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { adminRepository } from '../../repositories'
import type { ContactFormValues, ContactInsert, ContactRecord, ContactType } from '../../types/admin'

const emptyForm: ContactFormValues = {
  contact_type: 'person',
  full_name: '',
  company_name: '',
  position: '',
  email: '',
  phone: '',
  website: '',
  social_media: '',
  country: '',
  region: '',
  city: '',
  source: '',
  notes: '',
}

const typeLabels: Record<ContactType, string> = {
  person: 'Persona',
  company: 'Empresa',
}

const sourceLabels: Record<string, string> = {
  public_form: 'Formulario público',
  inquiry: 'Consulta',
  internal: 'Registro interno',
}

function textOrDash(value: string | null | undefined) {
  return value?.trim() || '\u2014'
}

function sourceLabel(value: string | null | undefined) {
  const normalized = value?.trim()
  if (!normalized) return '\u2014'
  return sourceLabels[normalized] ?? normalized
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function contactTitle(contact: ContactRecord) {
  return contact.contact_type === 'company'
    ? textOrDash(contact.company_name)
    : textOrDash(contact.full_name) === '\u2014'
      ? textOrDash(contact.company_name)
      : textOrDash(contact.full_name)
}

function contactLocation(contact: ContactRecord) {
  return [contact.country, contact.city].filter(Boolean).join(' / ') || '\u2014'
}

function toForm(contact: ContactRecord): ContactFormValues {
  return {
    contact_type: contact.contact_type,
    full_name: contact.full_name ?? '',
    company_name: contact.company_name ?? '',
    position: contact.position ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    website: contact.website ?? '',
    social_media: contact.social_media ?? '',
    country: contact.country ?? '',
    region: contact.region ?? '',
    city: contact.city ?? '',
    source: contact.source ?? '',
    notes: contact.notes ?? '',
  }
}

function nullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toPayload(values: ContactFormValues): Omit<ContactInsert, 'created_by'> {
  return {
    contact_type: values.contact_type,
    full_name: nullable(values.full_name),
    company_name: nullable(values.company_name),
    position: nullable(values.position),
    email: nullable(values.email),
    phone: nullable(values.phone),
    website: nullable(values.website),
    social_media: nullable(values.social_media),
    country: nullable(values.country),
    region: nullable(values.region),
    city: nullable(values.city),
    notes: nullable(values.notes),
    source: nullable(values.source),
  }
}

function validate(values: ContactFormValues) {
  const errors: Partial<Record<keyof ContactFormValues, string>> = {}
  if (!values.contact_type) errors.contact_type = 'Selecciona el tipo de contacto.'
  if (values.contact_type === 'person' && !values.full_name.trim()) errors.full_name = 'Ingresa el nombre completo.'
  if (values.contact_type === 'company' && !values.company_name.trim()) errors.company_name = 'Ingresa el nombre de la empresa.'
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido.'
  }
  if (values.website.trim()) {
    try {
      const url = new URL(values.website.trim())
      if (url.protocol !== 'https:' && url.protocol !== 'http:') errors.website = 'Ingresa una URL válida.'
    } catch {
      errors.website = 'Ingresa una URL válida.'
    }
  }
  return errors
}

type ContactFormModalProps = {
  contact: ContactRecord | null
  onClose: () => void
  onSaved: (contact: ContactRecord) => void
}

function ContactFormModal({ contact, onClose, onSaved }: ContactFormModalProps) {
  const [values, setValues] = useState<ContactFormValues>(() => (contact ? toForm(contact) : emptyForm))
  const [initialValues] = useState<ContactFormValues>(() => (contact ? toForm(contact) : emptyForm))
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({})
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dirtyRef = useRef(false)
  const onCloseRef = useRef(onClose)

  const dirty = JSON.stringify(values) !== JSON.stringify(initialValues)

  useEffect(() => {
    dirtyRef.current = dirty
  }, [dirty])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (dirtyRef.current && !window.confirm('Hay cambios sin guardar. ?Descartarlos?')) return
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function requestClose() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ?Descartarlos?')) return
    onClose()
  }

  function setField(field: keyof ContactFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setStatus('Revisa los campos marcados.')
      return
    }

    setSaving(true)
    setStatus('')
    const result = contact
      ? await adminRepository.updateContact(contact.id, toPayload(values))
      : await adminRepository.createContact(toPayload(values))
    setSaving(false)

    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible guardar el contacto.')
      return
    }

    setStatus('Contacto guardado correctamente.')
    onSaved(result.data)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-form-title"
      data-testid="contact-form-modal"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 id="contact-form-title" className="text-xl font-semibold text-[#17202d]">
              {contact ? 'Editar contacto' : 'Nuevo contacto'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">Las notas internas no son públicas.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={requestClose} className="rounded-md p-2 text-slate-600 hover:bg-slate-100" aria-label="Cerrar formulario">
            <X size={22} />
          </button>
        </div>

        <form className="grid gap-5 px-5 py-5" onSubmit={handleSubmit} noValidate>
          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-[#17202d]">Tipo de contacto *</legend>
            <div className="flex flex-wrap gap-3">
              {(['person', 'company'] as ContactType[]).map((type) => (
                <label key={type} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="contact_type"
                    value={type}
                    checked={values.contact_type === type}
                    onChange={() => setField('contact_type', type)}
                  />
                  {typeLabels[type]}
                </label>
              ))}
            </div>
            {errors.contact_type && <p className="text-sm text-red-700">{errors.contact_type}</p>}
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField id="full_name" label="Nombre completo" value={values.full_name} error={errors.full_name} onChange={(value) => setField('full_name', value)} />
            <TextField id="company_name" label="Empresa" value={values.company_name} error={errors.company_name} onChange={(value) => setField('company_name', value)} />
            <TextField id="position" label="Cargo" value={values.position} onChange={(value) => setField('position', value)} />
            <TextField id="email" label="Correo electrónico" value={values.email} error={errors.email} type="email" onChange={(value) => setField('email', value)} />
            <TextField id="phone" label="Teléfono o WhatsApp" value={values.phone} onChange={(value) => setField('phone', value)} />
            <TextField id="website" label="Sitio web" value={values.website} error={errors.website} type="url" onChange={(value) => setField('website', value)} />
            <TextField id="social_media" label="Red social" value={values.social_media} onChange={(value) => setField('social_media', value)} />
            <TextField id="country" label="País" value={values.country} onChange={(value) => setField('country', value)} />
            <TextField id="region" label="Región" value={values.region} onChange={(value) => setField('region', value)} />
            <TextField id="city" label="Ciudad" value={values.city} onChange={(value) => setField('city', value)} />
            <TextField id="source" label="Fuente" value={values.source} onChange={(value) => setField('source', value)} />
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="notes">
            Notas internas
            <textarea
              id="notes"
              value={values.notes}
              onChange={(event) => setField('notes', event.target.value)}
              rows={4}
              className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
            />
          </label>

          <div className="min-h-6 text-sm text-slate-700" aria-live="polite">
            {status}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={requestClose} className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d]">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type TextFieldProps = {
  id: keyof ContactFormValues
  label: string
  value: string
  error?: string
  type?: string
  onChange: (value: string) => void
}

function TextField({ id, label, value, error, type = 'text', onChange }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
      />
      {error && (
        <span id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  )
}

export function AdminContacts() {
  const [contacts, setContacts] = useState<ContactRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ContactType | 'all'>('all')
  const [editing, setEditing] = useState<ContactRecord | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const actionButtonRef = useRef<HTMLElement | null>(null)

  async function loadContacts() {
    setLoading(true)
    setError('')
    const result = await adminRepository.listContacts()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setContacts(result.data)
  }

  useEffect(() => {
    void loadContacts()
  }, [])

  const visibleContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return contacts.filter((contact) => {
      if (filter !== 'all' && contact.contact_type !== filter) return false
      if (!normalizedQuery) return true
      return [contact.full_name, contact.company_name, contact.email, contact.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery))
    })
  }, [contacts, filter, query])

  function openCreate() {
    actionButtonRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(contact: ContactRecord) {
    actionButtonRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setEditing(contact)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    window.setTimeout(() => actionButtonRef.current?.focus(), 0)
  }

  function handleSaved(saved: ContactRecord) {
    setContacts((current) => {
      const exists = current.some((item) => item.id === saved.id)
      const next = exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      return [...next].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    })
    setNotice('Contacto guardado correctamente.')
    closeModal()
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6">
      <AdminPageHeader
        title="Contactos"
        text="Personas y organizaciones relacionadas con oportunidades, proveedores y consultas."
        actionLabel="Nuevo contacto"
        onAction={openCreate}
      />

      <div className="sr-only" aria-live="polite">
        {notice}
      </div>

      <section className="grid min-w-0 max-w-full gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor="contacts-search">
            Buscar contactos
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
              <input
                id="contacts-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre, empresa, correo o teléfono"
                className="w-full rounded-md border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
              />
            </span>
          </label>

          <div className="grid gap-2 text-sm font-medium text-slate-700">
            Filtro
            <div className="flex rounded-md border border-slate-300 p-1">
              {[
                ['all', 'Todos'],
                ['person', 'Persona'],
                ['company', 'Empresa'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as ContactType | 'all')}
                  className={`rounded px-3 py-2 text-sm font-semibold ${filter === value ? 'bg-[#17202d] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="grid gap-3" aria-label="Cargando contactos">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg border border-slate-200 bg-white" />
          ))}
        </div>
      )}

      {!loading && error && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">No fue posible cargar contactos</h2>
          <p className="mt-2 text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void loadContacts()} className="mt-4 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Reintentar
          </button>
        </section>
      )}

      {!loading && !error && contacts.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <h2 className="text-xl font-semibold text-[#17202d]">Aún no hay contactos</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Crea el primer contacto manualmente o espera a que una futura solicitud sea revisada y convertida.
          </p>
          <button type="button" onClick={openCreate} className="mt-5 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            Crear contacto
          </button>
        </section>
      )}

      {!loading && !error && contacts.length > 0 && visibleContacts.length === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No hay contactos que coincidan con la búsqueda actual.
        </section>
      )}

      {!loading && !error && visibleContacts.length > 0 && (
      <section className="min-w-0 max-w-full rounded-lg border border-slate-200 bg-white">
          <div className="hidden w-full min-w-0 max-w-full overflow-x-auto md:block">
            <table className="min-w-[780px] w-full table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nombre o empresa</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">País o ciudad</th>
                  <th className="px-4 py-3">Fuente</th>
                  <th className="px-4 py-3">Última actualización</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibleContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-4 py-4 font-medium text-[#17202d]">{contactTitle(contact)}</td>
                    <td className="px-4 py-4">{typeLabels[contact.contact_type]}</td>
                    <td className="px-4 py-4 break-words">{textOrDash(contact.email)}</td>
                    <td className="px-4 py-4">{textOrDash(contact.phone)}</td>
                    <td className="px-4 py-4">{contactLocation(contact)}</td>
                    <td className="px-4 py-4">{sourceLabel(contact.source)}</td>
                    <td className="px-4 py-4">{formatDate(contact.updated_at)}</td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => openEdit(contact)} className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-[#17202d] hover:border-[#235b3e]">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {visibleContacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[#17202d]">{contactTitle(contact)}</h2>
                    <p className="mt-1 text-sm text-slate-600">{typeLabels[contact.contact_type]}</p>
                  </div>
                  <button type="button" onClick={() => openEdit(contact)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-[#17202d]">
                    Editar
                  </button>
                </div>
                <dl className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div>
                    <dt className="font-semibold">Correo</dt>
                    <dd className="break-words">{textOrDash(contact.email)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Teléfono</dt>
                    <dd>{textOrDash(contact.phone)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">País o ciudad</dt>
                    <dd>{contactLocation(contact)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Fuente</dt>
                    <dd>{sourceLabel(contact.source)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Última actualización</dt>
                    <dd>{formatDate(contact.updated_at)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {modalOpen && <ContactFormModal contact={editing} onClose={closeModal} onSaved={handleSaved} />}
    </div>
  )
}
