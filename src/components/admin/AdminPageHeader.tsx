type AdminPageHeaderProps = {
  eyebrow?: string
  title: string
  text?: string
  actionLabel?: string
  onAction?: () => void
}

export function AdminPageHeader({ eyebrow = 'Panel privado', title, text, actionLabel, onAction }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="admin-page-eyebrow">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#17202d] md:text-[1.875rem]">{title}</h1>
        {text && <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-slate-600">{text}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="w-fit whitespace-nowrap rounded-md bg-[#173b2b] px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#102a1f] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
