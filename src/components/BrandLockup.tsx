type BrandLockupProps = {
  className?: string
  variant?: 'header' | 'footer'
}

export function BrandLockup({ className = '', variant = 'header' }: BrandLockupProps) {
  const symbolSize = variant === 'header' ? 'h-8 sm:h-11 lg:h-12' : 'h-14'
  const wordmarkSize = variant === 'header' ? 'h-7 max-w-[9.75rem] sm:h-10 sm:max-w-none lg:h-11' : 'h-12'
  const separatorSize = variant === 'header' ? 'h-7 sm:h-10 lg:h-11' : 'h-12'

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 sm:gap-3 ${className}`}>
      <img src="/brand/arista-symbol-v2.png" alt="" className={`${symbolSize} w-auto shrink-0 object-contain`} />
      <span className={`w-px shrink-0 bg-brand/45 ${separatorSize}`} aria-hidden="true" />
      <img
        src="/brand/arista-logo-horizontal.png"
        alt="Arista Partners - Representación & Desarrollo Comercial"
        className={`w-auto min-w-0 shrink object-contain ${wordmarkSize}`}
      />
    </span>
  )
}
