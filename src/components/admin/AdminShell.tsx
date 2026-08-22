import { Menu, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { BrandLockup } from '../BrandLockup'
import { useAdminAuth } from '../../admin/useAdminAuth'

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Oportunidades', href: '/admin/oportunidades' },
  { label: 'Proveedores', href: '/admin/proveedores' },
  { label: 'Contactos', href: '/admin/contactos' },
  { label: 'Consultas', href: '/admin/consultas' },
  { label: 'Recepciones', href: '/admin/recepciones' },
  { label: 'Seguimiento', href: '/admin/seguimiento' },
  { label: 'Acuerdos', href: '/admin/acuerdos' },
  { label: 'Configuración', href: '/admin/configuracion' },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const auth = useAdminAuth()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#f3f0ea] text-slate-800">
      <header className="border-b border-[#17202d]/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <BrandLockup />
          <div className="flex items-center gap-3">
            {auth.status === 'ready' && (
              <button
                type="button"
                onClick={() => void auth.signOut()}
                className="hidden rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#17202d] hover:border-[#235b3e] sm:inline-flex"
              >
                Cerrar sesión
              </button>
            )}
            <button
              type="button"
              className="rounded-md border border-slate-300 p-2 text-[#17202d] lg:hidden"
              aria-label={open ? 'Cerrar navegación administrativa' : 'Abrir navegación administrativa'}
              aria-expanded={open}
              aria-controls="admin-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside id="admin-nav" className={`${open ? 'block' : 'hidden'} lg:block`}>
          <nav className="rounded-lg border border-slate-200 bg-white p-3" aria-label="Panel administrativo">
            <div className="grid gap-1">
              {adminNav.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/admin'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-[#e9f2ed] text-[#17202d]' : 'text-slate-600 hover:bg-[#faf8f2] hover:text-[#17202d]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  )
}
