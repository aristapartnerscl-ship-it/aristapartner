import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { RefreshCcw, RotateCcw, Save } from 'lucide-react'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { isSupabaseConfigured } from '../../lib/supabase-config'
import { adminRepository } from '../../repositories'
import type {
  CommissionType,
  OrganizationSettingsFormValues,
  OrganizationSettingsRecord,
  OrganizationSettingsUpdateValues,
  Priority,
} from '../../types/admin'
import { commissionTypeLabels, commissionTypes, priorities, priorityLabels } from '../opportunity-labels'

const emptyForm: OrganizationSettingsFormValues = {
  display_name: '',
  legal_name: '',
  tax_identifier: '',
  public_email: '',
  public_phone: '',
  website_url: '',
  address_line: '',
  city_region: '',
  country_code: 'CL',
  timezone: 'America/Santiago',
  locale: 'es-CL',
  default_currency: 'CLP',
  default_opportunity_priority: 'medium',
  default_follow_up_days: '0',
  default_attribution_days: '0',
  default_commission_type: '',
  default_commission_value: '',
}

function settingsToForm(settings: OrganizationSettingsRecord): OrganizationSettingsFormValues {
  return {
    display_name: settings.display_name,
    legal_name: settings.legal_name ?? '',
    tax_identifier: settings.tax_identifier ?? '',
    public_email: settings.public_email ?? '',
    public_phone: settings.public_phone ?? '',
    website_url: settings.website_url ?? '',
    address_line: settings.address_line ?? '',
    city_region: settings.city_region ?? '',
    country_code: settings.country_code,
    timezone: settings.timezone,
    locale: settings.locale,
    default_currency: settings.default_currency,
    default_opportunity_priority: settings.default_opportunity_priority,
    default_follow_up_days: String(settings.default_follow_up_days),
    default_attribution_days: String(settings.default_attribution_days),
    default_commission_type: settings.default_commission_type ?? '',
    default_commission_value: settings.default_commission_value === null ? '' : String(settings.default_commission_value),
  }
}

function nullable(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function integerInRange(value: string, min: number, max: number) {
  if (!/^\d+$/.test(value.trim())) return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) return null
  return number
}

function parseCommissionValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const number = Number(trimmed)
  return Number.isFinite(number) ? number : null
}

function validateSettings(form: OrganizationSettingsFormValues) {
  const errors: Partial<Record<keyof OrganizationSettingsFormValues, string>> = {}
  if (!form.display_name.trim()) errors.display_name = 'Ingresa el nombre público.'
  if (!/^[A-Z]{2}$/.test(form.country_code.trim())) errors.country_code = 'Usa exactamente dos letras mayúsculas.'
  if (!/^[A-Z]{3}$/.test(form.default_currency.trim())) errors.default_currency = 'Usa exactamente tres letras mayúsculas.'
  if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(form.locale.trim())) errors.locale = 'Usa un formato como es-CL.'
  if (form.website_url.trim() && !/^https:\/\/.+/i.test(form.website_url.trim())) errors.website_url = 'El sitio web debe comenzar con https://.'
  if (form.public_email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.public_email.trim())) errors.public_email = 'Ingresa un correo válido.'
  if (integerInRange(form.default_follow_up_days, 0, 365) === null) errors.default_follow_up_days = 'Debe estar entre 0 y 365.'
  if (integerInRange(form.default_attribution_days, 0, 3650) === null) errors.default_attribution_days = 'Debe estar entre 0 y 3650.'

  if (form.default_commission_type) {
    const commission = parseCommissionValue(form.default_commission_value)
    if (commission === null) errors.default_commission_value = 'Ingresa el valor predeterminado.'
    else if (form.default_commission_type === 'percentage' && (commission < 0 || commission > 100)) {
      errors.default_commission_value = 'El porcentaje debe estar entre 0 y 100.'
    } else if (form.default_commission_type === 'fixed_amount' && commission < 0) {
      errors.default_commission_value = 'El monto no puede ser negativo.'
    }
  }

  return errors
}

function buildPayload(form: OrganizationSettingsFormValues): OrganizationSettingsUpdateValues {
  const commissionType = form.default_commission_type ? (form.default_commission_type as CommissionType) : null
  return {
    display_name: form.display_name.trim(),
    legal_name: nullable(form.legal_name),
    tax_identifier: nullable(form.tax_identifier),
    public_email: nullable(form.public_email),
    public_phone: nullable(form.public_phone),
    website_url: nullable(form.website_url),
    address_line: nullable(form.address_line),
    city_region: nullable(form.city_region),
    country_code: form.country_code.trim(),
    timezone: form.timezone.trim(),
    locale: form.locale.trim(),
    default_currency: form.default_currency.trim(),
    default_opportunity_priority: form.default_opportunity_priority as Priority,
    default_follow_up_days: Number(form.default_follow_up_days.trim()),
    default_attribution_days: Number(form.default_attribution_days.trim()),
    default_commission_type: commissionType,
    default_commission_value: commissionType ? Number(form.default_commission_value.trim()) : null,
  }
}

export function AdminSettings() {
  const [settings, setSettings] = useState<OrganizationSettingsRecord | null>(null)
  const [form, setForm] = useState<OrganizationSettingsFormValues>(emptyForm)
  const [initialSignature, setInitialSignature] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof OrganizationSettingsFormValues, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const dirty = useMemo(() => initialSignature !== '' && JSON.stringify(form) !== initialSignature, [form, initialSignature])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [dirty])

  async function load() {
    setLoading(true)
    setError('')
    setStatus('')
    const result = await adminRepository.getOrganizationSettings()
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSettings(result.data)
    if (!result.data) {
      setForm(emptyForm)
      setInitialSignature('')
      return
    }
    const next = settingsToForm(result.data)
    setForm(next)
    setInitialSignature(JSON.stringify(next))
  }

  useEffect(() => {
    void load()
  }, [])

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setStatus('')
    setForm((current) => {
      if (name === 'default_commission_type' && value === '') return { ...current, default_commission_type: '', default_commission_value: '' }
      return { ...current, [name]: value }
    })
  }

  function resetChanges() {
    if (!settings) return
    const next = settingsToForm(settings)
    setForm(next)
    setFieldErrors({})
    setStatus('Cambios restablecidos.')
  }

  async function recoverSettings() {
    if (recovering) return
    setRecovering(true)
    setError('')
    setStatus('')
    const result = await adminRepository.createOrganizationSettingsIfMissing()
    setRecovering(false)
    if (result.error || !result.data) {
      setError(result.error ?? 'No fue posible crear la configuración inicial.')
      return
    }
    const next = settingsToForm(result.data)
    setSettings(result.data)
    setForm(next)
    setInitialSignature(JSON.stringify(next))
    setStatus('Configuración inicial creada.')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !settings) return
    const errors = validateSettings(form)
    setFieldErrors(errors)
    if (Object.values(errors).some(Boolean)) {
      setStatus('Revisa los campos marcados.')
      return
    }

    setSaving(true)
    setStatus('')
    const result = await adminRepository.updateOrganizationSettings(buildPayload(form))
    setSaving(false)
    if (result.error || !result.data) {
      setStatus(result.error ?? 'No fue posible guardar la configuración.')
      return
    }
    const next = settingsToForm(result.data)
    setSettings(result.data)
    setForm(next)
    setInitialSignature(JSON.stringify(next))
    setStatus('Configuración guardada correctamente.')
  }

  if (loading) return <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Cargando configuración...</section>

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Configuración" text="Parámetros operativos internos de Arista Partners para nuevos registros administrativos." />

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Esta configuración no debe utilizarse para guardar contraseñas, claves API, tokens ni datos bancarios.
      </section>

      {error && (
        <section className="grid gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-slate-700">{error}</p>
          <button type="button" onClick={() => void load()} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white">
            <RefreshCcw size={18} aria-hidden="true" />
            Reintentar
          </button>
        </section>
      )}

      {!error && !settings && (
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-[#17202d]">Configuración inicial no encontrada</h2>
          <p className="text-sm leading-6 text-slate-600">
            La fila singleton de configuración no existe. Puedes crear una configuración inicial con valores neutros y seguros.
          </p>
          <button type="button" disabled={recovering} onClick={() => void recoverSettings()} className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {recovering ? 'Creando...' : 'Crear configuración inicial'}
          </button>
          <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>
        </section>
      )}

      {settings && (
        <form className="grid gap-6" onSubmit={submit} noValidate>
          <SettingsSection title="Identidad">
            <TextInput label="Nombre público *" name="display_name" value={form.display_name} onChange={updateField} error={fieldErrors.display_name} />
            <TextInput label="Razón social" name="legal_name" value={form.legal_name} onChange={updateField} error={fieldErrors.legal_name} />
            <TextInput label="Identificador tributario" name="tax_identifier" value={form.tax_identifier} onChange={updateField} error={fieldErrors.tax_identifier} />
            <TextInput label="Sitio web" name="website_url" value={form.website_url} onChange={updateField} error={fieldErrors.website_url} />
          </SettingsSection>

          <SettingsSection title="Contacto público">
            <TextInput label="Correo público" name="public_email" value={form.public_email} onChange={updateField} error={fieldErrors.public_email} />
            <TextInput label="Teléfono público" name="public_phone" value={form.public_phone} onChange={updateField} error={fieldErrors.public_phone} />
            <TextInput label="Dirección" name="address_line" value={form.address_line} onChange={updateField} error={fieldErrors.address_line} />
            <TextInput label="Ciudad o región" name="city_region" value={form.city_region} onChange={updateField} error={fieldErrors.city_region} />
            <TextInput label="País" name="country_code" value={form.country_code} onChange={updateField} error={fieldErrors.country_code} />
          </SettingsSection>

          <SettingsSection title="Regionalización">
            <TextInput label="Zona horaria" name="timezone" value={form.timezone} onChange={updateField} error={fieldErrors.timezone} />
            <TextInput label="Idioma/región" name="locale" value={form.locale} onChange={updateField} error={fieldErrors.locale} />
            <TextInput label="Moneda predeterminada" name="default_currency" value={form.default_currency} onChange={updateField} error={fieldErrors.default_currency} />
          </SettingsSection>

          <SettingsSection title="Operación comercial">
            <SelectInput label="Prioridad predeterminada de oportunidades" name="default_opportunity_priority" value={form.default_opportunity_priority} onChange={updateField} error={fieldErrors.default_opportunity_priority}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
            </SelectInput>
            <TextInput label="Días predeterminados para seguimiento" name="default_follow_up_days" type="number" value={form.default_follow_up_days} onChange={updateField} error={fieldErrors.default_follow_up_days} />
            <TextInput label="Días predeterminados de atribución" name="default_attribution_days" type="number" value={form.default_attribution_days} onChange={updateField} error={fieldErrors.default_attribution_days} />
            <SelectInput label="Tipo de comisión predeterminado" name="default_commission_type" value={form.default_commission_type} onChange={updateField} error={fieldErrors.default_commission_type}>
              <option value="">Sin comisión predeterminada</option>
              {commissionTypes.map((type) => <option key={type} value={type}>{commissionTypeLabels[type]}</option>)}
            </SelectInput>
            <TextInput label="Valor de comisión predeterminado" name="default_commission_value" type="number" value={form.default_commission_value} onChange={updateField} error={fieldErrors.default_commission_value} />
          </SettingsSection>

          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-[#17202d]">Información técnica</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-3">
              <ReadonlyItem label="Última actualización" value={formatDateTime(settings.updated_at)} />
              <ReadonlyItem label="Actualizado por" value={settings.updatedByProfile?.full_name ?? 'No registrado'} />
              <ReadonlyItem label="Estado de conexión" value={isSupabaseConfigured ? 'Supabase conectado' : 'Supabase no configurado'} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            La web pública conserva sus datos desde archivos estáticos. Sincronizar estos datos públicos requiere una estrategia separada y segura sin debilitar RLS ni exponer esta tabla a visitantes anónimos.
          </section>

          <div aria-live="polite" className="min-h-6 text-sm text-slate-700">{status}</div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={resetChanges} disabled={!dirty} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-[#17202d] disabled:opacity-50">
              <RotateCcw size={18} aria-hidden="true" />
              Restablecer cambios
            </button>
            <button type="submit" disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              <Save size={18} aria-hidden="true" />
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-[#17202d]">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

function TextInput({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
}: {
  label: string
  name: keyof OrganizationSettingsFormValues
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  error?: string
  type?: string
}) {
  const errorId = `${name}-error`
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <input
        id={name}
        name={name}
        type={type}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
      />
      <FieldError id={errorId} message={error} />
    </label>
  )
}

function SelectInput({
  label,
  name,
  value,
  onChange,
  error,
  children,
}: {
  label: string
  name: keyof OrganizationSettingsFormValues
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  error?: string
  children: ReactNode
}) {
  const errorId = `${name}-error`
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-[#235b3e] focus:ring-2 focus:ring-[#235b3e]/20"
      >
        {children}
      </select>
      <FieldError id={errorId} message={error} />
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <span id={id} className="text-sm text-red-700">{message}</span>
}

function ReadonlyItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{value}</dd>
    </div>
  )
}
