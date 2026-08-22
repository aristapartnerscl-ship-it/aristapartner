import { BriefcaseBusiness, Factory, ShoppingCart } from 'lucide-react'
import type { ComponentType } from 'react'

export type OpportunityType = 'comprar' | 'vender' | 'proveedor'

export type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'radio'

export type OpportunityField = {
  name: string
  label: string
  type?: FieldType
  required?: boolean
  options?: string[]
}

export type OpportunitySection = {
  title: string
  fields: OpportunityField[]
}

export type OpportunityFormConfig = {
  type: OpportunityType
  title: string
  description: string
  icon: ComponentType<{ size?: number; className?: string }>
  sections: OpportunitySection[]
}

export type BuyerFormData = {
  fullName: string
  organization: string
  role: string
  email: string
  phone: string
  city: string
  region: string
  country: string
  need: string
  needDetail: string
  volume: string
  budget: string
  currency: string
  deadline: string
  deliveryPlace: string
  hasQuotes: string
  additionalInfo: string
}

export type SellerFormData = {
  fullName: string
  company: string
  role: string
  email: string
  phone: string
  website: string
  social: string
  city: string
  region: string
  country: string
  offer: string
  offerDetail: string
  targetClient: string
  coverage: string
  capacity: string
  priceRange: string
  currency: string
  channel: string
  differentiators: string
  additionalInfo: string
}

export type SupplierFormData = {
  fullName: string
  company: string
  email: string
  phone: string
  website: string
  city: string
  region: string
  country: string
  products: string
  categories: string
  coverage: string
  capacity: string
  minimumSale: string
  invoice: string
  conditions: string
  additionalInfo: string
}

export type OpportunityFormData = BuyerFormData | SellerFormData | SupplierFormData

const contactFields: OpportunityField[] = [
  { name: 'fullName', label: 'Nombre completo', required: true },
  { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
  { name: 'phone', label: 'Teléfono o WhatsApp', type: 'tel', required: true },
  { name: 'city', label: 'Ciudad' },
  { name: 'region', label: 'Región' },
  { name: 'country', label: 'País', required: true },
]

export const opportunityForms: OpportunityFormConfig[] = [
  {
    type: 'comprar',
    title: 'Necesito comprar',
    description: 'Presenta una necesidad de compra para evaluar proveedores y alternativas comerciales.',
    icon: ShoppingCart,
    sections: [
      {
        title: 'Datos de contacto',
        fields: [
          contactFields[0],
          { name: 'organization', label: 'Empresa, organización o actividad' },
          { name: 'role', label: 'Cargo' },
          ...contactFields.slice(1),
        ],
      },
      {
        title: 'Necesidad de compra',
        fields: [
          { name: 'need', label: '¿Qué producto, servicio o solución necesitas?', required: true },
          { name: 'needDetail', label: 'Descripción detallada de la necesidad', type: 'textarea', required: true },
          { name: 'volume', label: 'Cantidad o volumen estimado' },
          { name: 'budget', label: 'Presupuesto aproximado' },
          { name: 'currency', label: 'Moneda', type: 'select', options: ['CLP', 'USD', 'Otra'] },
          { name: 'deadline', label: 'Fecha o plazo en que lo necesitas' },
          { name: 'deliveryPlace', label: 'Lugar de entrega o prestación' },
          { name: 'hasQuotes', label: '¿Ya cuentas con cotizaciones?', type: 'radio', options: ['Sí', 'No'] },
          { name: 'additionalInfo', label: 'Información adicional', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'vender',
    title: 'Quiero vender',
    description: 'Comparte tu oferta para buscar compradores, distribuidores o canales empresariales.',
    icon: BriefcaseBusiness,
    sections: [
      {
        title: 'Datos de contacto',
        fields: [
          contactFields[0],
          { name: 'company', label: 'Empresa, marca o actividad', required: true },
          { name: 'role', label: 'Cargo' },
          contactFields[1],
          contactFields[2],
          { name: 'website', label: 'Sitio web' },
          { name: 'social', label: 'Instagram o red social' },
          ...contactFields.slice(3),
        ],
      },
      {
        title: 'Oferta comercial',
        fields: [
          { name: 'offer', label: 'Producto o servicio que deseas ofrecer', required: true },
          { name: 'offerDetail', label: 'Descripción de la oferta', type: 'textarea', required: true },
          { name: 'targetClient', label: 'Tipo de cliente que buscas' },
          { name: 'coverage', label: 'Cobertura geográfica' },
          { name: 'capacity', label: 'Capacidad de venta, producción o atención' },
          { name: 'priceRange', label: 'Precio o rango referencial' },
          { name: 'currency', label: 'Moneda', type: 'select', options: ['CLP', 'USD', 'Otra'] },
          { name: 'channel', label: '¿Buscas compradores, distribuidores, retail u otro canal?' },
          { name: 'differentiators', label: 'Diferenciadores principales', type: 'textarea' },
          { name: 'additionalInfo', label: 'Información adicional', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'proveedor',
    title: 'Quiero ser proveedor',
    description: 'Registra tu perfil para ser considerado en futuras búsquedas de proveedores.',
    icon: Factory,
    sections: [
      {
        title: 'Datos de contacto',
        fields: [
          contactFields[0],
          { name: 'company', label: 'Empresa o razón social', required: true },
          contactFields[1],
          contactFields[2],
          { name: 'website', label: 'Sitio web' },
          ...contactFields.slice(3),
        ],
      },
      {
        title: 'Perfil del proveedor',
        fields: [
          { name: 'products', label: 'Productos o servicios ofrecidos', type: 'textarea', required: true },
          { name: 'categories', label: 'Categorías en las que trabaja', required: true },
          { name: 'coverage', label: 'Cobertura geográfica' },
          { name: 'capacity', label: 'Capacidad de atención o suministro' },
          { name: 'minimumSale', label: 'Venta mínima o volumen mínimo' },
          { name: 'invoice', label: '¿Emite factura?', type: 'radio', options: ['Sí', 'No'] },
          { name: 'conditions', label: 'Principales condiciones comerciales', type: 'textarea' },
          { name: 'additionalInfo', label: 'Información adicional', type: 'textarea' },
        ],
      },
    ],
  },
]

export function getInitialFormData(config: OpportunityFormConfig) {
  return config.sections.reduce<Record<string, string>>((values, section) => {
    section.fields.forEach((field) => {
      values[field.name] = ''
    })
    return values
  }, {})
}
