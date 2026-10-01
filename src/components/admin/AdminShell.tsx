import { BriefcaseBusiness, Building2, ChevronDown, Home, Menu, Settings, Users, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { isRedComercialAdmin } from '../../admin/red-comercial-utils'
import { useAdminAuth } from '../../admin/useAdminAuth'
import { AdminNotificationsCenter } from './AdminNotificationsCenter'

const primaryNav = [
  { label: 'Inicio', href: '/admin', icon: Home },
  { label: 'Empresas Arista', href: '/admin/empresas', icon: Building2 },
  { label: 'Mis carteras', href: '/admin/mis-carteras', icon: BriefcaseBusiness },
]

const adminOnlyNav = [
  { label: 'Colaboradores', href: '/admin/colaboradores', icon: Users },
  { label: 'Asignaciones', href: '/admin/asignaciones', icon: ChevronDown },
  { label: 'Configuracion', href: '/admin/configuracion', icon: Settings },
]

const legacyNav = [
  { label: 'Dashboard anterior', href: '/admin/dashboard-anterior' },
  { label: 'Pipeline comercial', href: '/admin/pipeline' },
  { label: 'Propuestas', href: '/admin/propuestas' },
  { label: 'Prospeccion', href: '/admin/prospeccion' },
  { label: 'Oportunidades', href: '/admin/oportunidades' },
  { label: 'Proveedores', href: '/admin/proveedores' },
  { label: 'Contactos', href: '/admin/contactos' },
  { label: 'Consultas', href: '/admin/consultas' },
  { label: 'Recepciones', href: '/admin/recepciones' },
  { label: 'Seguimiento', href: '/admin/seguimiento' },
  { label: 'Acuerdos', href: '/admin/acuerdos' },
]

function UserInitials({ name }: { name?: string | null }) {
  const initials = (name || 'Usuario')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9d2c4] bg-[#eef4ef] text-xs font-semibold text-[#173b2b]">
      {initials || 'U'}
    </span>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [legacyOpen, setLegacyOpen] = useState(false)
  const auth = useAdminAuth()
  const admin = isRedComercialAdmin(auth.profile)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen min-w-0 max-w-full bg-[#f4f0e8] text-slate-800 lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside id="admin-nav" className={`${open ? 'fixed inset-0 z-50 block bg-[#0f241b] p-4' : 'hidden'} min-w-0 shrink-0 overflow-y-auto border-r border-white/10 bg-[#0f241b] text-white shadow-[inset_-1px_0_rgba(255,255,255,0.05)] lg:sticky lg:top-0 lg:block lg:h-screen lg:p-4`}>
        <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <div>
            <p className="text-lg font-semibold leading-none tracking-tight">ARISTA</p>
            <p className="mt-1.5 text-xs font-medium text-[#b8d2c4]">Red Comercial</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar navegacion administrativa" className="rounded-lg border border-white/15 p-2 text-white lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="mt-5 grid gap-5" aria-label="Red Comercial Arista">
          <div className="grid gap-1.5">
            {primaryNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-[#244534] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-[#d7e3da] hover:bg-white/[0.08] hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          {admin && (
            <div className="border-t border-white/10 pt-4">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8fb09c]">Administracion</p>
              <div className="grid gap-1.5">
                {adminOnlyNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          isActive ? 'bg-[#244534] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-[#d7e3da] hover:bg-white/[0.08] hover:text-white'
                        }`
                      }
                    >
                      <Icon size={17} aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )}

          {admin && (
            <div className="border-t border-white/10 pt-4">
              <button type="button" onClick={() => setLegacyOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#b8d2c4] transition hover:bg-white/[0.08] hover:text-white">
                Modulos anteriores
                <ChevronDown size={16} className={legacyOpen ? 'rotate-180 transition' : 'transition'} aria-hidden="true" />
              </button>
              {legacyOpen && (
                <div className="mt-2 grid gap-1 border-l border-white/10 pl-2">
                  {legacyNav.map((item) => (
                    <NavLink key={item.href} to={item.href} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-[#cbdacf] hover:bg-white/[0.08] hover:text-white'}`}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#ddd6ca] bg-[#fbfaf6]/90 backdrop-blur">
          <div className="flex h-14 min-w-0 items-center justify-between gap-4 px-5 lg:px-8">
            <button type="button" className="rounded-lg border border-[#c9c1b4] bg-white p-2 text-[#17202d] lg:hidden" aria-label="Abrir navegacion administrativa" aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="min-w-0" aria-hidden="true" />
            <div className="flex items-center gap-3">
              {auth.status === 'ready' && (
                <>
                  <AdminNotificationsCenter />
                  <UserInitials name={auth.profile?.full_name} />
                  <button type="button" onClick={() => void auth.signOut()} className="hidden rounded-lg border border-[#c9c1b4] bg-white px-3 py-2 text-sm font-semibold text-[#17202d] transition hover:border-[#235b3e] hover:bg-[#fbfaf7] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2 sm:inline-flex">
                    Cerrar sesion
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="min-w-0 px-5 py-6 lg:px-8 lg:py-7">
          <main className="mx-auto min-w-0 max-w-full xl:max-w-[1500px]">{children}</main>
        </div>
      </div>
    </div>
  )
}
