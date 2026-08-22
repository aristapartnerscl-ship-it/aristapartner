type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  text?: string
  actionLabel?: string
  onAction?: () => void
}

export function AdminPageHeader({ eyebrow = 'Panel privado', title, text, actionLabel, onAction }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#235b3e]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17202d] md:text-4xl">{title}</h1>
        {text && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{text}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="w-fit rounded-md bg-[#17202d] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#101722]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
