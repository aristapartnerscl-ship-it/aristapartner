import { Bell, Check, CheckCheck, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminRepository } from '../../repositories'
import type { AdminNotificationRecord } from '../../types/admin'

function isSafeAdminNotificationPath(path: string | null) {
  return Boolean(path && path.startsWith('/admin/') && !path.startsWith('/admin//'))
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AdminNotificationsCenter() {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState<AdminNotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshCount = useCallback(async () => {
    const result = await adminRepository.getUnreadAdminNotificationCount()
    if (!result.error) setUnreadCount(result.data)
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await adminRepository.listAdminNotifications(10)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setNotifications(result.data)
    setUnreadCount(result.data.filter((notification) => !notification.read_at).length)
  }, [])

  useEffect(() => {
    void refreshCount()
    const intervalId = window.setInterval(() => void refreshCount(), 60_000)

    function onFocus() {
      if (open) {
        void loadNotifications()
        return
      }
      void refreshCount()
    }

    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadNotifications, open, refreshCount])

  useEffect(() => {
    if (open) void loadNotifications()
  }, [loadNotifications, open])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  async function markRead(notification: AdminNotificationRecord) {
    if (notification.read_at || actionLoading) return
    setActionLoading(true)
    const result = await adminRepository.markAdminNotificationRead(notification.id)
    setActionLoading(false)
    if (result.error || !result.data) {
      setError(result.error ?? 'No fue posible actualizar la notificacion.')
      return
    }
    setNotifications((current) => current.map((item) => (item.id === result.data?.id ? result.data : item)))
    setUnreadCount((current) => Math.max(current - 1, 0))
  }

  async function markAllRead() {
    if (actionLoading || unreadCount === 0) return
    setActionLoading(true)
    const result = await adminRepository.markAllAdminNotificationsRead()
    setActionLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at ?? readAt })))
    setUnreadCount(0)
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-md border border-slate-300 bg-white p-2 text-[#17202d] outline-none hover:border-[#235b3e] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2"
        aria-label={`Abrir centro de notificaciones administrativas. ${unreadCount} sin leer.`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-[#235b3e] px-1.5 py-0.5 text-center text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          className="absolute right-0 z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white shadow-lg"
          aria-label="Centro de notificaciones administrativas"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-[#17202d]">Notificaciones</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-md p-2 text-slate-600 outline-none hover:bg-[#faf8f2] focus-visible:ring-2 focus-visible:ring-[#235b3e]"
                aria-label="Actualizar notificaciones"
                onClick={() => void loadNotifications()}
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rounded-md p-2 text-slate-600 outline-none hover:bg-[#faf8f2] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[#235b3e]"
                aria-label="Marcar todas las notificaciones como leidas"
                disabled={unreadCount === 0 || actionLoading}
                onClick={() => void markAllRead()}
              >
                <CheckCheck size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-3">
            {loading && <p className="rounded-md bg-[#faf8f2] p-3 text-sm text-slate-600">Cargando notificaciones...</p>}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-slate-700" role="alert">
                <p>{error}</p>
                <button type="button" className="mt-3 text-sm font-semibold text-[#235b3e]" onClick={() => void loadNotifications()}>
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <p className="rounded-md bg-[#faf8f2] p-3 text-sm text-slate-600">
                Aun no hay notificaciones administrativas. En Fase 1 la campana no genera eventos automaticamente; se activara cuando
                se implemente Fase 2.
              </p>
            )}

            {!loading && !error && notifications.length > 0 && (
              <ul className="grid gap-2">
                {notifications.map((notification) => {
                  const safePath = isSafeAdminNotificationPath(notification.action_path) ? notification.action_path : null
                  return (
                    <li
                      key={notification.id}
                      className={`rounded-md border p-3 ${notification.read_at ? 'border-slate-200 bg-white' : 'border-[#235b3e]/30 bg-[#eef5f1]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#17202d]">{notification.title}</p>
                          {notification.message && <p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>}
                          <p className="mt-2 text-xs text-slate-500">{formatNotificationDate(notification.created_at)}</p>
                        </div>
                        {!notification.read_at && (
                          <button
                            type="button"
                            className="shrink-0 rounded-md p-2 text-[#235b3e] outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#235b3e]"
                            aria-label={`Marcar como leida: ${notification.title}`}
                            disabled={actionLoading}
                            onClick={() => void markRead(notification)}
                          >
                            <Check size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-slate-500">{notification.read_at ? 'Leida' : 'No leida'}</span>
                        {safePath && (
                          <Link className="text-sm font-semibold text-[#235b3e]" to={safePath} onClick={() => setOpen(false)}>
                            Ver detalle
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
