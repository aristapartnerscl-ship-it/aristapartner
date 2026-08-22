import { AlertCircle } from 'lucide-react'

export function ConfigurationPending() {
  return (
    <div className="rounded-lg border border-[#235b3e]/25 bg-[#eef5f1] p-6">
      <AlertCircle className="text-[#235b3e]" size={30} aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-[#17202d]">Supabase no configurado</h1>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        La conexión del panel administrativo aún no está configurada. Agrega `VITE_SUPABASE_URL` y
        `VITE_SUPABASE_PUBLISHABLE_KEY` en un archivo de entorno local para habilitar autenticación y datos.
      </p>
    </div>
  )
}
