type BrandLockupProps = {
  className?: string
  variant?: 'header' | 'footer'
}

export function BrandLockup({ className = '', variant = 'header' }: BrandLockupProps) {
  const symbolSize = variant === 'header' ? 'h-11 sm:h-12' : 'h-14'
  const wordmarkSize = variant === 'header' ? 'h-10 lg:h-11' : 'h-12'
  const separatorSize = variant === 'header' ? 'h-10 lg:h-11' : 'h-12'
  const desktopOnly = variant === 'header' ? 'hidden sm:block' : 'block'

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img src="/brand/arista-symbol.png" alt="" className={`${symbolSize} w-auto shrink-0 object-contain`} />
      <span className={`${desktopOnly} w-px bg-brand/45 ${separatorSize}`} aria-hidden="true" />
      <img
        src="/brand/arista-logo-horizontal.png"
        alt="Arista Partners - Representación & Desarrollo Comercial"
        className={`${desktopOnly} w-auto shrink-0 object-contain ${wordmarkSize}`}
      />
    </span>
  )
}
