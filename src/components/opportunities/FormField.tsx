import type { OpportunityField } from '../../data/opportunityForms'
import { FieldError } from './FieldError'

type FormFieldProps = {
  field: OpportunityField
  value: string
  error?: string
  formType: string
  onChange: (name: string, value: string) => void
}

export function FormField({ field, value, error, formType, onChange }: FormFieldProps) {
  const id = `${formType}-${field.name}`
  const errorId = `${id}-error`
  const inputClass =
    'w-full rounded-md border border-border bg-white px-3 py-3 text-base text-graphite outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15'
  const describedBy = error ? errorId : undefined

  if (field.type === 'radio') {
    return (
      <fieldset>
        <legend className="block text-sm font-medium text-text-muted">
          {field.label} {field.required && <span className="text-red-700">*</span>}
        </legend>
        <div className="mt-2 flex flex-wrap gap-3" aria-describedby={describedBy}>
          {field.options?.map((option) => (
            <label
              key={option}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-text-muted"
            >
              <input
                type="radio"
                name={field.name}
                value={option}
                checked={value === option}
                onChange={(event) => onChange(field.name, event.target.value)}
                className="h-4 w-4 accent-brand"
              />
              {option}
            </label>
          ))}
        </div>
        <div className="mt-2">
          <FieldError id={errorId} message={error} />
        </div>
      </fieldset>
    )
  }

  return (
    <div className={field.type === 'textarea' ? 'md:col-span-2' : undefined}>
      <label htmlFor={id} className="block text-sm font-medium text-text-muted">
        {field.label} {field.required && <span className="text-red-700">*</span>}
      </label>
      <div className="mt-2">
        {field.type === 'textarea' ? (
          <textarea
            id={id}
            name={field.name}
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={`${inputClass} min-h-32 resize-y`}
          />
        ) : field.type === 'select' ? (
          <select
            id={id}
            name={field.name}
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={inputClass}
          >
            <option value="">Selecciona una opción</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            name={field.name}
            type={field.type ?? 'text'}
            value={value}
            onChange={(event) => onChange(field.name, event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={inputClass}
          />
        )}
      </div>
      <div className="mt-2">
        <FieldError id={errorId} message={error} />
      </div>
    </div>
  )
}
