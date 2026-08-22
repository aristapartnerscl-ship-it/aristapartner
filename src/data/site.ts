import {
  ArrowRightLeft,
  BriefcaseBusiness,
  Building2,
  Handshake,
  LineChart,
  SearchCheck,
  ShieldCheck,
  ShoppingCart,
  Target,
  Users,
} from 'lucide-react'

export const publicSiteUrl = ''

export const siteMeta = {
  defaultTitle: 'Arista Partners | Representación y desarrollo comercial',
  defaultDescription:
    'Representación, intermediación y desarrollo comercial para conectar necesidades, ofertas y proveedores mediante una gestión activa.',
  themeColor: '#1A1F23',
  pages: {
    '/': {
      title: 'Arista Partners | Representación y desarrollo comercial',
      description:
        'Arista Partners convierte necesidades y ofertas en oportunidades comerciales con representación, búsqueda y seguimiento activo.',
    },
    '/nosotros': {
      title: 'Nosotros | Arista Partners',
      description:
        'Conoce el propósito, enfoque y forma de trabajo de Arista Partners como iniciativa chilena de gestión comercial directa.',
    },
    '/servicios': {
      title: 'Servicios comerciales | Arista Partners',
      description:
        'Servicios de representación comercial, búsqueda de proveedores, desarrollo B2B y acompañamiento de negociaciones.',
    },
    '/como-funciona': {
      title: 'Cómo funciona | Arista Partners',
      description:
        'Revisa cómo Arista Partners evalúa, coordina y acompaña oportunidades comerciales desde la recepción hasta la negociación.',
    },
    '/oportunidades': {
      title: 'Presentar una oportunidad | Arista Partners',
      description:
        'Presenta una necesidad de compra, una oferta comercial o un perfil de proveedor para evaluación inicial.',
    },
    '/contacto': {
      title: 'Contacto | Arista Partners',
      description:
        'Envía una consulta general sobre Arista Partners, sus servicios o su forma de trabajo.',
    },
    '/privacidad': {
      title: 'Política de privacidad | Arista Partners',
      description:
        'Política de privacidad de Arista Partners SpA sobre formularios públicos, solicitudes comerciales, proveedores tecnológicos y derechos de las personas.',
    },
    '/terminos': {
      title: 'Términos y condiciones | Arista Partners',
      description:
        'Términos y condiciones de uso de la web pública de Arista Partners SpA y recepción de solicitudes comerciales.',
    },
    '/terminos-y-privacidad': {
      title: 'Documentos legales | Arista Partners',
      description:
        'Acceso a la Política de privacidad y a los Términos y condiciones del sitio web de Arista Partners.',
    },
    '/404': {
      title: 'Página no encontrada | Arista Partners',
      description:
        'La página solicitada no existe o el enlace ha cambiado. Vuelve al inicio o presenta una oportunidad comercial.',
    },
    '/admin/login': {
      title: 'Acceso administrativo | Arista Partners',
      description: 'Acceso privado al panel administrativo de Arista Partners.',
    },
    '/admin': {
      title: 'Panel administrativo | Arista Partners',
      description: 'Panel privado preparado para gestionar oportunidades, contactos, proveedores y seguimiento.',
    },
    '/admin/oportunidades': {
      title: 'Admin oportunidades | Arista Partners',
      description: 'Vista privada de oportunidades comerciales.',
    },
    '/admin/proveedores': {
      title: 'Admin proveedores | Arista Partners',
      description: 'Vista privada de proveedores.',
    },
    '/admin/contactos': {
      title: 'Admin contactos | Arista Partners',
      description: 'Vista privada de contactos comerciales.',
    },
    '/admin/consultas': {
      title: 'Admin consultas | Arista Partners',
      description: 'Vista privada de consultas generales.',
    },
    '/admin/seguimiento': {
      title: 'Admin seguimiento | Arista Partners',
      description: 'Vista privada de actividades y seguimiento.',
    },
    '/admin/acuerdos': {
      title: 'Admin acuerdos | Arista Partners',
      description: 'Vista privada de acuerdos comerciales administrativos.',
    },
    '/admin/configuracion': {
      title: 'Admin configuración | Arista Partners',
      description: 'Configuración técnica del panel privado.',
    },
  },
}

export const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Cómo funciona', href: '/como-funciona' },
  { label: 'Oportunidades', href: '/oportunidades' },
  { label: 'Contacto', href: '/contacto' },
]

export const serviceCards = [
  {
    icon: Handshake,
    title: 'Representación comercial',
    text: 'Presentamos productos y servicios ante compradores, distribuidores y clientes empresariales con seguimiento activo.',
  },
  {
    icon: SearchCheck,
    title: 'Búsqueda de proveedores',
    text: 'Levantamos alternativas, comparamos condiciones y acercamos opciones confiables para necesidades de compra.',
  },
  {
    icon: ArrowRightLeft,
    title: 'Intermediación integral',
    text: 'Acompañamos el proceso entre las partes para ordenar información, facilitar avances y apoyar la negociación.',
  },
  {
    icon: Building2,
    title: 'Desarrollo B2B',
    text: 'Convertimos propuestas B2C en oportunidades empresariales: volumen, retail, distribución y regalos corporativos.',
  },
]

export const processSteps = [
  {
    title: 'Diagnóstico',
    text: 'Entendemos la oferta, necesidad, plazos, criterios comerciales y tipo de contraparte buscada.',
  },
  {
    title: 'Búsqueda y filtro',
    text: 'Identificamos oportunidades o proveedores, validamos encaje y priorizamos las alternativas con mayor potencial.',
  },
  {
    title: 'Conexión comercial',
    text: 'Presentamos a las partes con información clara y mantenemos coordinación durante los avances.',
  },
  {
    title: 'Negociación y cierre',
    text: 'Apoyamos condiciones, seguimiento, documentación comercial y próximos pasos para concretar la oportunidad.',
  },
]

export const benefits = [
  { icon: Target, title: 'Foco comercial', text: 'Menos dispersión y más avance sobre oportunidades concretas.' },
  { icon: Users, title: 'Red de contactos', text: 'Búsqueda activa de contrapartes y canales adecuados.' },
  { icon: ShieldCheck, title: 'Proceso ordenado', text: 'Información, expectativas y etapas claras para ambas partes.' },
  { icon: LineChart, title: 'Escalabilidad', text: 'Un modelo flexible para iniciar simple y crecer por verticales.' },
]

export const opportunities = [
  'Ventas por volumen a empresas',
  'Regalos corporativos y campañas internas',
  'Distribución mayorista o regional',
  'Ingreso a retail, marketplaces o canales especializados',
  'Abastecimiento para operaciones y proyectos',
  'Servicios B2B recurrentes o por contrato',
]

export const faqs = [
  {
    question: '¿Arista compra o vende directamente?',
    answer:
      'Arista actúa como intermediario comercial activo. Puede representar una oferta o buscar proveedores para una necesidad concreta.',
  },
  {
    question: '¿Trabajan solo con empresas chilenas?',
    answer:
      'El foco inicial está en Chile, con una operación preparada para evaluar oportunidades nacionales o internacionales según el caso.',
  },
  {
    question: '¿Qué tipo de productos o servicios pueden representar?',
    answer:
      'Productos físicos, servicios empresariales y propuestas B2C que puedan transformarse en ventas por volumen o canales B2B.',
  },
]

export const audiencePaths = [
  {
    icon: ShoppingCart,
    title: 'Necesito comprar',
    text: 'Buscamos proveedores adecuados, comparamos alternativas y apoyamos la negociación para compras empresariales.',
    href: '/oportunidades?tipo=comprar',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Quiero vender',
    text: 'Representamos tu oferta ante clientes, distribuidores o canales B2B con una gestión comercial estructurada.',
    href: '/oportunidades?tipo=vender',
  },
]
