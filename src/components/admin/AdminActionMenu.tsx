import { MoreHorizontal } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

export type AdminActionMenuItem = {
  label: string
  onSelect: () => void
  icon?: ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
  separator?: boolean
}

export function AdminActionMenu({ items, label = 'Acciones' }: { items: AdminActionMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false })
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) {
      setPosition((value) => value.ready ? { ...value, ready: false } : value)
      return
    }

    const updatePosition = () => {
      const trigger = triggerRef.current
      const popover = popoverRef.current
      if (!trigger || !popover) return
      const triggerRect = trigger.getBoundingClientRect()
      const popoverWidth = popover.offsetWidth
      const popoverHeight = popover.offsetHeight
      const viewportPadding = 8
      const gap = 5
      const left = Math.min(
        Math.max(viewportPadding, triggerRect.right - popoverWidth),
        Math.max(viewportPadding, window.innerWidth - popoverWidth - viewportPadding),
      )
      const opensUp = triggerRect.bottom + gap + popoverHeight > window.innerHeight - viewportPadding
        && triggerRect.top - gap - popoverHeight >= viewportPadding
      const top = opensUp
        ? triggerRect.top - popoverHeight - gap
        : Math.min(triggerRect.bottom + gap, window.innerHeight - popoverHeight - viewportPadding)
      setPosition({ top, left, ready: true })
    }

    const frame = window.requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, items.length])

  const popoverStyle: CSSProperties = {
    top: position.top,
    left: position.left,
    opacity: position.ready ? 1 : 0,
    pointerEvents: position.ready ? 'auto' : 'none',
  }

  return <div ref={rootRef} className="admin-action-menu">
    <button ref={triggerRef} type="button" aria-label={label} aria-expanded={open} className="admin-action-menu__trigger" onClick={(event) => { event.stopPropagation(); setOpen((value) => !value) }}>
      <MoreHorizontal size={16} aria-hidden="true" />
    </button>
    {open && createPortal(
      <div ref={popoverRef} role="menu" className="admin-action-menu__popover" style={popoverStyle}>
        {items.map((item, index) => <div key={`${item.label}-${index}`} className={item.separator ? 'admin-action-menu__separator' : ''}>
          <button type="button" role="menuitem" disabled={item.disabled} className={`admin-action-menu__item ${item.tone === 'danger' ? 'admin-action-menu__item--danger' : ''}`} onClick={() => { setOpen(false); item.onSelect() }}>
            {item.icon}<span>{item.label}</span>
          </button>
        </div>)}
      </div>,
      document.body,
    )}
  </div>
}
