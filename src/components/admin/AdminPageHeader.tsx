type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  text?: string
  actionLabel?: string
  onAction?: () => void
}

export function AdminPageHeader({ eyebrow = 'Panel privado', title, text, actionLabel, onAction }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2f6b4f]">{eyebrow}</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#17202d] md:text-[2rem]">{title}</h1>
        {text && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{text}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="w-fit rounded-lg bg-[#173b2b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102a1f] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
