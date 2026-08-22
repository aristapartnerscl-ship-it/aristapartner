import { AdminFilters } from '../../components/admin/AdminFilters'
import { AdminPageHeader } from '../../components/admin/AdminPageHeader'
import { EmptyState } from '../../components/admin/EmptyState'
import { isSupabaseConfigured } from '../../lib/supabase-config'

function DataStatus() {
  if (isSupabaseConfigured) return null
  return (
    <div className="rounded-lg border border-[#235b3e]/25 bg-[#eef5f1] p-4 text-sm font-medium text-[#17202d]">
      Supabase no configurado. Se muestra estructura sin datos.
    </div>
  )
}

export function AdminOpportunities() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Oportunidades" text="Búsqueda y revisión de oportunidades comerciales." actionLabel="Nueva oportunidad" />
      <DataStatus />
      <AdminFilters filters={[{ label: 'Tipo', options: ['Compra', 'Venta'] }, { label: 'Estado', options: ['Nueva', 'Activa', 'Negociando'] }, { label: 'Prioridad', options: ['Baja', 'Media', 'Alta'] }]} />
      <EmptyState title="Sin oportunidades" text="No hay oportunidades registradas todavía. La vista queda preparada para tabla o detalle futuro." />
    </div>
  )
}

export function AdminSuppliers() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Proveedores" text="Perfiles de proveedores disponibles para futuras necesidades." actionLabel="Nuevo proveedor" />
      <DataStatus />
      <AdminFilters filters={[{ label: 'Estado', options: ['Pendiente', 'Aprobado', 'Inactivo'] }, { label: 'Categoría', options: ['Sin categorías conectadas'] }]} />
      <EmptyState title="Sin proveedores" text="No hay proveedores registrados todavía." />
    </div>
  )
}

export function AdminContacts() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Contactos" text="Personas y organizaciones relacionadas con oportunidades." actionLabel="Nuevo contacto" />
      <DataStatus />
      <AdminFilters filters={[{ label: 'Tipo', options: ['Persona', 'Empresa'] }]} />
      <EmptyState title="Sin contactos" text="No hay contactos registrados todavía." />
    </div>
  )
}

export function AdminInquiries() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Consultas" text="Consultas generales recibidas desde el formulario de contacto." />
      <DataStatus />
      <AdminFilters filters={[{ label: 'Estado', options: ['Nueva', 'Leída', 'Respondida'] }, { label: 'Motivo', options: ['Servicios', 'Colaboración', 'Otro'] }]} />
      <EmptyState title="Sin consultas" text="No hay consultas registradas todavía." />
    </div>
  )
}

export function AdminFollowUps() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Seguimiento" text="Acciones vencidas, de hoy y próximas." />
      <DataStatus />
      <div className="grid gap-4 md:grid-cols-3">
        {['Vencidos', 'Hoy', 'Próximos'].map((title) => (
          <EmptyState key={title} title={title} text="Sin acciones registradas." />
        ))}
      </div>
    </div>
  )
}

export function AdminAgreements() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Acuerdos" text="Condiciones comerciales administrativas acordadas con Arista." />
      <DataStatus />
      <AdminFilters filters={[{ label: 'Modalidad', options: ['Honorarios', 'Comisión', 'Mixta'] }, { label: 'Estado', options: ['Borrador', 'Propuesto', 'Aceptado'] }]} />
      <EmptyState title="Sin acuerdos" text="No hay acuerdos registrados todavía. No se muestran cálculos de ingresos en esta fase." />
    </div>
  )
}

export function AdminSettings() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Configuración" text="Estado técnico del panel y variables necesarias." />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Estado de conexión Supabase</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isSupabaseConfigured
            ? 'Las variables públicas de Supabase están configuradas.'
            : 'La conexión del panel administrativo aún no está configurada.'}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-[#17202d]">Variables de entorno</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` fuera de la interfaz. No se muestran ni editan
          claves secretas desde el panel.
        </p>
      </div>
    </div>
  )
}
