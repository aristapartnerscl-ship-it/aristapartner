import type { SelectHTMLAttributes } from 'react'

type AdminSelectWidth = 'company' | 'responsible' | 'status' | 'channel' | 'period' | 'default'

type AdminSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  width?: AdminSelectWidth
}

const widthClasses: Record<AdminSelectWidth, string> = {
  company: 'admin-select--company',
  responsible: 'admin-select--responsible',
  status: 'admin-select--status',
  channel: 'admin-select--channel',
  period: 'admin-select--period',
  default: 'admin-select--default',
}

export function AdminSelect({ label, width = 'default', id, className = '', children, ...props }: AdminSelectProps) {
  const generatedId = id ?? (label ? `admin-select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined)
  const select = <select {...props} id={generatedId} className={`admin-select ${widthClasses[width]} ${className}`.trim()}>{children}</select>

  if (!label) return select
  return <label className="admin-select-field"><span className="admin-field-label">{label}</span>{select}</label>
}
