import { BarChart3, BriefcaseBusiness, Building2, CalendarClock, ChevronDown, CircleDollarSign, GitBranch, Home, Inbox, Menu, Moon, PanelLeftClose, PanelLeftOpen, Radar, Settings, Sun, Target, Users, X } from 'lucide-react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { isRedComercialAdmin } from '../../admin/red-comercial-utils'
import { useAdminAuth } from '../../admin/useAdminAuth'
import { AdminNotificationsCenter } from './AdminNotificationsCenter'
import { ADMIN_THEME_STORAGE_KEY, applyAdminTheme, getInitialAdminTheme, type AdminTheme } from './admin-theme'

const primaryNav = [
  { label: 'Inicio', href: '/admin', icon: Home },
  { label: 'Empresas Arista', href: '/admin/empresas', icon: Building2 },
  { label: 'Mis carteras', href: '/admin/mis-carteras', icon: BriefcaseBusiness },
  { label: 'Prospectos', href: '/admin/prospectos', icon: Target },
  { label: 'Seguimientos', href: '/admin/seguimientos', icon: CalendarClock },
  { label: 'Oportunidades', href: '/admin/oportunidades', icon: CircleDollarSign },
  { label: 'Oportunidades cruzadas', href: '/admin/oportunidades-cruzadas', icon: GitBranch },
  { label: 'Resultados', href: '/admin/resultados', icon: BarChart3 },
]

const adminOnlyNav = [
  { label: 'Solicitudes web', href: '/admin/solicitudes-web', icon: Inbox },
  { label: 'Prospección Arista', href: '/admin/prospeccion-arista', icon: Radar },
  { label: 'Colaboradores', href: '/admin/colaboradores', icon: Users },
  { label: 'Asignaciones', href: '/admin/asignaciones', icon: ChevronDown },
  { label: 'Configuracion', href: '/admin/configuracion', icon: Settings },
]

const legacyNav = [
  { label: 'Dashboard anterior', href: '/admin/dashboard-anterior' },
  { label: 'Pipeline comercial', href: '/admin/pipeline' },
  { label: 'Propuestas', href: '/admin/propuestas' },
  { label: 'Prospeccion', href: '/admin/prospeccion' },
  { label: 'Oportunidades anteriores', href: '/admin/oportunidades-anterior' },
  { label: 'Proveedores', href: '/admin/proveedores' },
  { label: 'Contactos', href: '/admin/contactos' },
  { label: 'Consultas', href: '/admin/consultas' },
  { label: 'Recepciones', href: '/admin/recepciones' },
  { label: 'Seguimiento', href: '/admin/seguimiento' },
  { label: 'Acuerdos', href: '/admin/acuerdos' },
]

const ADMIN_SIDEBAR_STORAGE_KEY = 'arista-admin-sidebar-collapsed'

function UserInitials({ name }: { name?: string | null }) {
  const initials = (name || 'Usuario')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span className="admin-user-avatar inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d9d2c4] bg-[#eef4ef] text-xs font-semibold text-[#173b2b]">
      {initials || 'U'}
    </span>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [legacyOpen, setLegacyOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === 'true')
  const [compactByLayout, setCompactByLayout] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [theme, setTheme] = useState<AdminTheme>(() => {
    const bootstrapped = document.documentElement.dataset.adminTheme
    return bootstrapped === 'dark' || bootstrapped === 'light' ? bootstrapped : getInitialAdminTheme()
  })
  const auth = useAdminAuth()
  const location = useLocation()
  const newRedComercial = /^\/admin(?:\/|$)/.test(location.pathname) && !location.pathname.includes('anterior') && !['/admin/dashboard-anterior', '/admin/pipeline', '/admin/prospeccion', '/admin/propuestas', '/admin/proveedores', '/admin/contactos', '/admin/consultas', '/admin/recepciones', '/admin/seguimiento', '/admin/acuerdos'].some((path) => location.pathname.startsWith(path))
  const admin = isRedComercialAdmin(auth.profile)
  const effectiveCollapsed = collapsed || compactByLayout

  useEffect(() => {
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(collapsed))
  }, [collapsed])

  useEffect(() => {
    applyAdminTheme(theme)
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    function syncLayout() {
      const detailOpen = document.documentElement.dataset.redProspectDetail === 'open'
      setDetailOpen(detailOpen)
      setCompactByLayout(detailOpen && window.innerWidth <= 1440)
    }
    syncLayout()
    window.addEventListener('resize', syncLayout)
    window.addEventListener('arista-red-prospect-detail', syncLayout)
    return () => {
      window.removeEventListener('resize', syncLayout)
      window.removeEventListener('arista-red-prospect-detail', syncLayout)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div style={{ '--admin-topbar-height': '48px', '--detail-panel-width': '390px' } as CSSProperties} className={`admin-shell ${theme === 'dark' ? 'admin-theme-dark' : ''} min-h-screen min-w-0 max-w-full bg-[#f4f0e8] text-slate-800 lg:grid ${effectiveCollapsed ? 'lg:grid-cols-[68px_minmax(0,1fr)]' : 'lg:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <aside id="admin-nav" className={`${open ? 'fixed inset-0 z-50 flex bg-[#0f241b] p-3' : 'hidden'} admin-sidebar relative min-w-0 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[#0f241b] text-white shadow-[inset_-1px_0_rgba(255,255,255,0.05)] lg:sticky lg:top-0 lg:flex lg:h-screen lg:p-3`}>
        <div className={`admin-sidebar-header flex shrink-0 items-center rounded-xl border border-white/10 bg-white/[0.03] ${effectiveCollapsed ? 'justify-center px-1.5 py-2' : 'justify-between gap-2 px-2.5 py-3'}`}>
          <div className="hidden">
            {effectiveCollapsed ? <p className="text-base font-bold tracking-tight" title="Arista · Red Comercial">A</p> : <><p className="text-lg font-semibold leading-none tracking-tight">ARISTA</p><p className="mt-1.5 text-xs font-medium text-[#b8d2c4]">Red Comercial</p></>}
          </div>
          <NavLink to="/admin" end aria-label="Ir al inicio de Red Comercial Arista" onClick={() => setOpen(false)} className="admin-sidebar-brand flex min-w-0 items-center justify-center rounded-lg outline-none transition focus-visible:ring-2 focus-visible:ring-[#82b494] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f241b]">
            {effectiveCollapsed ? <img src="/brand/arista-symbol-v2.png" alt="Arista" className="h-9 w-9 object-contain" /> : <span className="flex items-center gap-2"><img src="/brand/arista-symbol-v2.png" alt="" className="h-9 w-9 object-contain" /><span><span className="block text-lg font-semibold leading-none tracking-tight">ARISTA</span><span className="mt-1 block text-xs font-medium text-[#b8d2c4]">Red Comercial</span></span></span>}
          </NavLink>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar navegacion administrativa" className="rounded-lg border border-white/15 p-2 text-white lg:hidden">
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5" aria-label="Red Comercial Arista">
          <div className="grid gap-4 pb-3">
          <div className="grid gap-1">
            {primaryNav.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  title={item.label}
                  end={item.href === '/admin'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex min-w-0 items-center rounded-lg text-sm font-semibold transition ${effectiveCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-2.5 py-2'} ${
                      isActive ? 'bg-[#244534] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-[#d7e3da] hover:bg-white/[0.08] hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} aria-hidden="true" />
                  {!effectiveCollapsed && <span className="truncate text-[13px]">{item.label}</span>}
                </NavLink>
              )
            })}
          </div>

          {admin && (
            <div className="border-t border-white/10 pt-3">
              {!effectiveCollapsed && <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fb09c]">Administracion</p>}
              <div className="grid gap-1">
                {adminOnlyNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      title={item.label}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                      `flex min-w-0 items-center rounded-lg text-sm font-semibold transition ${effectiveCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2 px-2.5 py-2'} ${
                          isActive ? 'bg-[#244534] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-[#d7e3da] hover:bg-white/[0.08] hover:text-white'
                        }`
                      }
                    >
                      <Icon size={17} aria-hidden="true" />
                    {!effectiveCollapsed && <span className="truncate text-[13px]">{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )}

          {admin && (
            <div className="border-t border-white/10 pt-3">
              <button type="button" onClick={() => setLegacyOpen((value) => !value)} title="Módulos anteriores" className={`flex w-full items-center rounded-lg py-2 text-sm font-semibold text-[#b8d2c4] transition hover:bg-white/[0.08] hover:text-white ${effectiveCollapsed ? 'justify-center px-2' : 'justify-between gap-3 px-2.5'}`}>
                {effectiveCollapsed ? <Menu size={17} aria-hidden="true" /> : <><span>Modulos anteriores</span><ChevronDown size={16} className={legacyOpen ? 'rotate-180 transition' : 'transition'} aria-hidden="true" /></>}
              </button>
              {legacyOpen && !effectiveCollapsed && (
                <div className={`mt-1.5 grid gap-0.5 border-white/10 ${effectiveCollapsed ? 'border-l pl-1' : 'border-l pl-2'}`}>
                  {legacyNav.map((item) => (
                    <NavLink key={item.href} to={item.href} title={item.label} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-2.5 py-1 text-sm font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-[#cbdacf] hover:bg-white/[0.08] hover:text-white'}`}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </nav>
        {legacyOpen && effectiveCollapsed && admin && (
          <div className="admin-sidebar-flyout fixed left-[76px] top-24 z-[70] w-56 rounded-xl border border-white/10 bg-[#173126] p-2 shadow-2xl" role="menu" aria-label="Módulos anteriores">
            <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8fb09c]">Módulos anteriores</p>
            <div className="grid gap-0.5">
              {legacyNav.map((item) => (
                <NavLink key={item.href} to={item.href} title={item.label} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${isActive ? 'bg-[#315543] text-white' : 'text-[#cbdacf] hover:bg-white/[0.08] hover:text-white'}`}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
        <div className="admin-sidebar-footer mt-auto hidden shrink-0 border-t border-white/10 pt-3 lg:block">
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={effectiveCollapsed ? 'Expandir menú' : 'Contraer menú'} title={effectiveCollapsed ? 'Expandir menú' : 'Contraer menú'} className={`flex w-full items-center rounded-lg py-2 text-sm font-semibold text-[#b8d2c4] transition hover:bg-white/[0.08] hover:text-white focus-visible:ring-2 focus-visible:ring-[#82b494] ${effectiveCollapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}>
            {effectiveCollapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /><span>Contraer menu</span></>}
          </button>
        </div>
      </aside>

      <div className="admin-content min-w-0">
        <header className="admin-topbar sticky top-0 z-30 border-b border-[#ddd6ca] bg-[#fbfaf6]/90 backdrop-blur">
          <div className="flex h-12 min-w-0 items-center justify-between gap-4 px-4 lg:px-5">
            <button type="button" className="rounded-lg border border-[#c9c1b4] bg-white p-2 text-[#17202d] lg:hidden" aria-label="Abrir navegacion administrativa" aria-expanded={open} aria-controls="admin-nav" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="min-w-0" aria-hidden="true" />
            <div className="flex items-center gap-3">
              {auth.status === 'ready' && (
                <>
                  <button type="button" className="admin-theme-toggle inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#c9c1b4] bg-white text-[#17202d] transition hover:border-[#235b3e] hover:text-[#235b3e] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2" aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} title={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
                  </button>
                  {admin && <AdminNotificationsCenter />}
                  <UserInitials name={auth.profile?.full_name} />
                  <button type="button" onClick={() => void auth.signOut()} className="hidden rounded-md border border-[#c9c1b4] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#17202d] transition hover:border-[#235b3e] hover:bg-[#fbfaf7] focus-visible:ring-2 focus-visible:ring-[#235b3e] focus-visible:ring-offset-2 sm:inline-flex">
                    Cerrar sesion
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="admin-content-inner min-w-0 px-4 py-4 lg:px-5 lg:py-5" style={detailOpen && window.innerWidth >= 1280 ? { paddingRight: 'calc(var(--detail-panel-width) + 8px)' } : undefined}>
          <main className={`mx-auto min-w-0 max-w-full xl:max-w-[1500px] ${newRedComercial ? 'admin-red-comercial' : ''}`}>{children}</main>
        </div>
      </div>
    </div>
  )
}
