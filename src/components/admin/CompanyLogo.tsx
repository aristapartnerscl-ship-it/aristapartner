import { companyInitials, companyLogoUrl } from '../../admin/red-comercial-utils'

type LogoRecord = { name: string; logo_storage_path?: string | null }

export function CompanyLogo({ company, size = 'md' }: { company: LogoRecord; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const url = companyLogoUrl(company)
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-xl' : size === 'sm' ? 'h-[42px] w-[42px] text-sm' : size === 'xs' ? 'h-7 w-7 text-[10px]' : 'h-12 w-12 text-base'

  if (url) {
    return (
      <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d8d2c6] bg-white`}>
        <img src={url} alt={`Logo de ${company.name}`} className="h-full w-full object-contain p-1.5" />
      </span>
    )
  }

  return (
    <span className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-lg border border-[#c8d9cf] bg-[#e7f0ea] font-semibold text-[#173b2b]`} aria-label={`Iniciales de ${company.name}`}>
      {companyInitials(company.name)}
    </span>
  )
}
