export type ContactChannel = {
  label: string
  value?: string
  href?: string
}

// Incorpora aquí los datos reales cuando estén definidos.
// Si un valor queda vacío, no se mostrará públicamente en la página.
export const contactChannels: ContactChannel[] = [
  { label: 'Correo electrónico', value: 'aristapartnerscl@gmail.com', href: 'mailto:aristapartnerscl@gmail.com' },
  { label: 'WhatsApp o teléfono', value: '' },
  { label: 'LinkedIn', value: '', href: '' },
  { label: 'Instagram', value: '', href: '' },
  { label: 'Horario de atención', value: '' },
  { label: 'Ubicación general', value: '' },
]
