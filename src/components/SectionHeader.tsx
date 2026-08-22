type SectionHeaderProps = {
  eyebrow?: string
  title: string
  text?: string
  align?: 'left' | 'center'
  tone?: 'default' | 'inverse'
}

export function SectionHeader({ eyebrow, title, text, align = 'left', tone = 'default' }: SectionHeaderProps) {
  const inverse = tone === 'inverse'
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow && <p className={`text-sm font-semibold uppercase tracking-[0.22em] ${inverse ? 'text-on-brand' : 'text-brand'}`}>{eyebrow}</p>}
      <h2 className={`mt-3 text-3xl font-semibold tracking-tight md:text-4xl ${inverse ? 'text-on-brand' : 'text-graphite'}`}>{title}</h2>
      {text && <p className={`mt-4 text-base leading-7 md:text-lg ${inverse ? 'text-on-brand-muted' : 'text-text-muted'}`}>{text}</p>}
    </div>
  )
}
