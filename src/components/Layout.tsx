import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { contactChannels } from '../data/contact'
import { hasPendingLegalIdentity, legalConfig } from '../data/legal'
import { navItems } from '../data/site'
import { BrandLockup } from './BrandLockup'

export function Layout() {
  const [isOpen, setIsOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const visibleChannels = contactChannels.filter((channel) => channel.value)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="min-h-screen bg-surface-muted text-text">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-graphite focus:shadow"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-50 border-b border-graphite/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 lg:gap-4 lg:px-8 lg:py-2.5">
          <Link to="/" className="flex min-w-0 items-center" onClick={() => setIsOpen(false)}>
            <span className="sr-only">Arista Partners - Representación & Desarrollo Comercial</span>
            <BrandLockup />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-surface-muted text-graphite shadow-sm' : 'text-text-muted hover:bg-surface-muted hover:text-graphite'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Link
            to="/contacto"
            className="hidden rounded-md bg-graphite px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark lg:inline-flex"
          >
            Conversemos
          </Link>

          <button
            type="button"
            ref={menuButtonRef}
            className="rounded-md border border-graphite/20 p-2 text-graphite lg:hidden"
            onClick={() => setIsOpen((value) => !value)}
            aria-expanded={isOpen}
            aria-controls="menu-movil"
            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {isOpen && (
          <nav
            id="menu-movil"
            className="max-h-[calc(100vh-70px)] overflow-y-auto border-t border-graphite/10 bg-white px-5 py-3 lg:hidden"
            aria-label="Navegación móvil"
          >
            <div className="mx-auto grid max-w-7xl gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-3 text-sm font-medium ${
                      isActive ? 'bg-surface-muted text-graphite' : 'text-text-muted hover:bg-surface-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="contenido" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="border-t-4 border-brand bg-graphite text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-8 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.25fr_0.7fr_0.8fr_0.8fr] lg:px-8 lg:py-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-start gap-3">
              <span className="inline-flex shrink-0 rounded-md bg-white p-2.5" aria-hidden="true">
                <img src="/brand/arista-symbol.png" alt="" className="h-10 w-10 object-contain" />
              </span>
              <div className="pt-0.5">
                <p className="text-base font-semibold text-white">Arista Partners</p>
                <p className="mt-1 text-sm leading-5 text-white/75">Representación &amp; Desarrollo Comercial</p>
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/75">
              Intermediación, representación y gestión comercial para conectar compradores, vendedores y proveedores con
              foco en oportunidades B2B.
            </p>
            {visibleChannels.length > 0 && (
              <div className="mt-4 grid gap-2 text-sm text-white/75">
                {visibleChannels.map((channel) =>
                  channel.href ? (
                    <a key={channel.label} href={channel.href} target="_blank" rel="noopener noreferrer">
                      {channel.label}: {channel.value}
                    </a>
                  ) : (
                    <span key={channel.label}>
                      {channel.label}: {channel.value}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Navegación</p>
            <div className="mt-3 grid gap-2 text-sm text-white/75">
              <Link to="/">Inicio</Link>
              <Link to="/nosotros">Nosotros</Link>
              <Link to="/servicios">Servicios</Link>
              <Link to="/como-funciona">Cómo funciona</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Oportunidades</p>
            <div className="mt-3 grid gap-2 text-sm text-white/75">
              <Link to="/oportunidades?tipo=comprar">Necesito comprar</Link>
              <Link to="/oportunidades?tipo=vender">Quiero vender</Link>
              <Link to="/oportunidades?tipo=proveedor">Quiero ser proveedor</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">Información</p>
            <div className="mt-3 grid gap-2 text-sm text-white/75">
              <Link to="/contacto">Contacto</Link>
              <Link to="/privacidad">Privacidad</Link>
              <Link to="/terminos">Términos y condiciones</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} {legalConfig.commercialName}
          {hasPendingLegalIdentity() ? '. Sitio informativo en preparación.' : '. Información legal configurada.'}
        </div>
      </footer>
    </div>
  )
}
