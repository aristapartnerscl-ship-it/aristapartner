import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

type AdminDetailModalProps = {
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
  returnFocusRef?: RefObject<HTMLButtonElement | null>
  size?: 'medium' | 'large'
}

export function AdminDetailModal({ title, subtitle, children, onClose, returnFocusRef, size = 'medium' }: AdminDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const trigger = returnFocusRef?.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = dialogRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ;(focusable ?? dialogRef.current)?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const elements = [...dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute('disabled'))
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus()
    }
  }, [returnFocusRef])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-2 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="admin-detail-modal-title" tabIndex={-1} className={`flex max-h-[calc(100vh-1rem)] w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl sm:max-h-[92vh] ${size === 'large' ? 'max-w-6xl' : 'max-w-4xl'}`}>
        <header className="admin-modal-header sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#235b3e]">Detalle</p>
            <h2 id="admin-detail-modal-title" className="mt-1 text-xl font-semibold text-[#17202d] sm:text-2xl">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-300 text-[#17202d] transition hover:bg-slate-50">
            <X size={17} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
