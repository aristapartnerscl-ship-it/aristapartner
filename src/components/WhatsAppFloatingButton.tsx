import { publicContact } from '../data/contact'

const whatsappMessage = 'Hola Arista Partners, quisiera realizar una consulta.'

export function WhatsAppIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`${className} fill-current`}>
      <path d="M16 3.2A12.8 12.8 0 0 0 5 22.55L3.2 28.8l6.42-1.68A12.8 12.8 0 1 0 16 3.2Zm0 23.3a10.5 10.5 0 1 1 0-21 10.5 10.5 0 0 1 0 21Zm5.76-7.84c-.31-.16-1.83-.9-2.11-1-.28-.1-.49-.16-.7.16-.2.31-.8 1-.98 1.2-.18.2-.36.23-.67.08-.31-.16-1.28-.47-2.44-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.31-.02-.48.13-.64.14-.14.31-.36.47-.54.15-.18.2-.31.31-.52.1-.2.05-.39-.03-.54-.08-.16-.7-1.68-.96-2.3-.25-.6-.5-.52-.7-.53h-.6c-.2 0-.54.08-.82.39-.28.31-1.07 1.04-1.07 2.55 0 1.5 1.1 2.95 1.25 3.15.15.2 2.16 3.3 5.23 4.63.73.32 1.3.5 1.75.64.74.24 1.42.2 1.95.12.6-.1 1.83-.75 2.09-1.47.26-.72.26-1.34.18-1.47-.08-.13-.28-.2-.59-.36Z" />
    </svg>
  )
}

export function WhatsAppFloatingButton() {
  const href = `https://wa.me/${publicContact.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-[60] inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#075e54] bg-[#25D366] text-white shadow-[0_8px_24px_rgba(7,94,84,0.28)] transition-transform hover:scale-105 focus-visible:scale-105 sm:bottom-5 sm:right-5 sm:h-[60px] sm:w-[60px]"
    >
      <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      <span className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-[-4.25rem] whitespace-nowrap rounded-md bg-graphite px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block">
        ¿Hablamos por WhatsApp?
      </span>
    </a>
  )
}
