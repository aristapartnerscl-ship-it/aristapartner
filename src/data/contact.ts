export type ContactChannel = {
  label: string
  value?: string
  href?: string
}

export const publicContact = {
  email: 'contacto@aristapartners.cl',
  phone: '+56 9 8289 1168',
  whatsappNumber: '56982891168',
  instagram: 'https://www.instagram.com/aristapartners/',
  facebook: 'https://www.facebook.com/profile.php?id=61593622778886',
  linkedin: 'https://www.linkedin.com/company/arista-partners/?viewAsMember=true',
} as const

export const contactChannels: ContactChannel[] = [
  { label: 'Correo electrónico', value: publicContact.email, href: `mailto:${publicContact.email}` },
  { label: 'WhatsApp o teléfono', value: publicContact.phone, href: `https://wa.me/${publicContact.whatsappNumber}` },
  { label: 'LinkedIn', value: '', href: '' },
  { label: 'Instagram', value: '', href: '' },
  { label: 'Horario de atención', value: '' },
  { label: 'Ubicación general', value: '' },
]
