import type { OpportunitySection } from '../../data/opportunityForms'
import { FormField } from './FormField'

type FormSectionProps = {
  section: OpportunitySection
  values: Record<string, string>
  errors: Record<string, string>
  formType: string
  onChange: (name: string, value: string) => void
}

export function FormSection({ section, values, errors, formType, onChange }: FormSectionProps) {
  return (
    <section className="card-elevated rounded-lg border bg-white p-5">
      <h2 className="text-xl font-semibold text-graphite">{section.title}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {section.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name] ?? ''}
            error={errors[field.name]}
            formType={formType}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  )
}
