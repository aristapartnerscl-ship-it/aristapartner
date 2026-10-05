import { Archive, Download, ExternalLink, FileText, Link as LinkIcon, Pencil, Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { AdminDetailModal } from '../../components/admin/AdminDetailModal'
import { adminRepository } from '../../repositories'
import type { RepresentedCompanyMaterialRecord } from '../../types/admin'

const visibilityLabels = { directory: 'Directorio', assigned_only: 'Sólo asignados', admin_only: 'Sólo Arista' } as const
const categoryLabels = ['Presentación', 'Brochure', 'Catálogo', 'Ficha técnica', 'Propuesta', 'Video', 'Capacitación', 'Contrato / Documento', 'Imagen', 'Otro']
const typeLabel = (type: string) => type === 'link' ? 'Enlace externo' : 'Archivo'
const sizeLabel = (size?: number | null) => !size ? '' : size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`
const errorText = (error: string | null | undefined) => error || 'No fue posible completar la operación.'

type Props = { companyId: string; materials: RepresentedCompanyMaterialRecord[]; admin: boolean; onReload: () => Promise<string | null> }

export function CompanyMaterialsPanel({ companyId, materials, admin, onReload }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RepresentedCompanyMaterialRecord | null>(null)
  const [preview, setPreview] = useState<RepresentedCompanyMaterialRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [mutationError, setMutationError] = useState('')

  async function save(payload: Record<string, unknown>, file?: File) {
    setMutationError('')
    setSaving(true)
    const result = editing
      ? await adminRepository.updateRepresentedCompanyMaterial(editing.id, payload)
      : await adminRepository.createRepresentedCompanyMaterial(companyId, payload, file)
    setSaving(false)
    if (result.error) { setMutationError(errorText(result.error)); return }
    setFormOpen(false)
    setEditing(null)
    const reloadError = await onReload()
    if (reloadError) setMutationError(reloadError)
  }

  async function download(material: RepresentedCompanyMaterialRecord) {
    if (material.material_type === 'link') { window.open(material.external_url ?? '', '_blank', 'noopener,noreferrer'); return }
    const result = await adminRepository.createRepresentedCompanyMaterialSignedUrl(material.id)
    if (result.error || !result.data) { setMutationError(errorText(result.error)); return }
    const anchor = document.createElement('a')
    anchor.href = result.data
    anchor.download = material.file_name ?? material.title
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  async function archive(material: RepresentedCompanyMaterialRecord) {
    if (!window.confirm(`¿Archivar “${material.title}”?`)) return
    const result = await adminRepository.archiveRepresentedCompanyMaterial(material.id)
    if (result.error) { setMutationError(errorText(result.error)); return }
    const reloadError = await onReload()
    if (reloadError) setMutationError(reloadError)
  }

  async function replace(material: RepresentedCompanyMaterialRecord, file: File) {
    setSaving(true)
    const result = await adminRepository.replaceRepresentedCompanyMaterial(material.id, file)
    setSaving(false)
    if (result.error) { setMutationError(errorText(result.error)); return }
    const reloadError = await onReload()
    if (reloadError) setMutationError(reloadError)
  }

  return <div className="grid gap-2">
    {mutationError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{mutationError}</p>}
    {materials.length === 0 ? <div className="rounded-lg border border-dashed border-[#c9c1b4] bg-white px-4 py-5 text-center"><p className="text-[12px] font-semibold text-[#17202d]">No hay materiales cargados</p><p className="mt-1 text-[11px] text-slate-500">Los materiales autorizados aparecerán aquí.</p>{admin && <button type="button" onClick={() => { setMutationError(''); setFormOpen(true) }} className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-[#235b3e] px-2.5 py-1.5 text-[11px] font-semibold text-white"><Upload size={13} />Agregar primer material</button>}</div> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{materials.map((material) => <MaterialCard key={material.id} material={material} admin={admin} onView={() => setPreview(material)} onDownload={() => void download(material)} onEdit={() => { setMutationError(''); setEditing(material); setFormOpen(true) }} onReplace={(file) => void replace(material, file)} onArchive={() => void archive(material)} />)}</div>}
    {admin && <div><button type="button" onClick={() => { setMutationError(''); setEditing(null); setFormOpen(true) }} className="inline-flex items-center gap-1.5 rounded-md border border-[#c9c1b4] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#235b3e]"><Upload size={13} />Agregar material</button></div>}
    {formOpen && <MaterialForm initial={editing} saving={saving} error={mutationError} onClose={() => { setFormOpen(false); setEditing(null) }} onSave={(payload, file) => void save(payload, file)} />}
    {preview && <MaterialPreview material={preview} onClose={() => setPreview(null)} onDownload={() => void download(preview)} onError={setMutationError} />}
  </div>
}

function MaterialCard({ material, admin, onView, onDownload, onEdit, onReplace, onArchive }: { material: RepresentedCompanyMaterialRecord; admin: boolean; onView: () => void; onDownload: () => void; onEdit: () => void; onReplace: (file: File) => void; onArchive: () => void }) {
  return <article className="flex min-h-[132px] flex-col rounded-lg border border-[#ddd6ca] bg-white p-3 shadow-[0_1px_2px_rgba(23,32,45,0.025)]"><div className="flex items-start gap-2"><span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#eef7f1] text-[#235b3e]">{material.material_type === 'link' ? <LinkIcon size={16} /> : <FileText size={16} />}</span><div className="min-w-0 flex-1"><h3 className="truncate text-[12px] font-semibold text-[#17202d]">{material.title}</h3><p className="mt-0.5 truncate text-[10px] text-slate-500">{material.category || 'Material comercial'} · {typeLabel(material.material_type)}{material.file_size ? ` · ${sizeLabel(material.file_size)}` : ''}</p></div></div><p className="mt-2 line-clamp-2 min-h-[30px] text-[11px] leading-4 text-slate-600">{material.description || 'Material comercial autorizado.'}</p><div className="mt-auto flex items-center justify-between gap-2 pt-2"><span className="rounded-full bg-[#fbfaf7] px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{visibilityLabels[material.visibility]}</span><div className="flex items-center gap-1"><button type="button" onClick={onView} className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-[#235b3e] hover:bg-[#eef7f1]">Ver</button><button type="button" onClick={onDownload} className="rounded-md px-1.5 py-1 text-[10px] font-semibold text-[#235b3e] hover:bg-[#eef7f1]">Descargar</button>{admin && <><button type="button" onClick={onEdit} aria-label={`Editar ${material.title}`} className="rounded-md p-1 text-slate-500 hover:bg-slate-50"><Pencil size={13} /></button>{material.material_type === 'file' && <label className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-50" title="Reemplazar archivo"><Upload size={13} /><input type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReplace(file); event.currentTarget.value = '' }} /></label>}<button type="button" onClick={onArchive} aria-label={`Archivar ${material.title}`} className="rounded-md p-1 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Archive size={13} /></button></>}</div></div></article>
}

function MaterialForm({ initial, saving, error, onClose, onSave }: { initial: RepresentedCompanyMaterialRecord | null; saving: boolean; error: string; onClose: () => void; onSave: (payload: Record<string, unknown>, file?: File) => void }) {
  const [type, setType] = useState<'file' | 'link'>(initial?.material_type === 'link' ? 'link' : 'file')
  const [values, setValues] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', category: initial?.category ?? '', visibility: initial?.visibility ?? 'directory', external_url: initial?.external_url ?? '', sort_order: String(initial?.sort_order ?? 0) })
  const [file, setFile] = useState<File | undefined>()
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSave({ ...values, material_type: type }, file) }
  return <AdminDetailModal title={initial ? 'Editar material' : 'Agregar material'} onClose={onClose} size="large"><form onSubmit={submit} className="grid gap-3">{error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}<div className="flex gap-1 rounded-md bg-[#fbfaf7] p-1"><button type="button" onClick={() => !initial && setType('file')} className={`flex-1 rounded px-2 py-1.5 text-[11px] font-semibold ${type === 'file' ? 'bg-white text-[#235b3e] shadow-sm' : 'text-slate-500'}`}>Archivo</button><button type="button" onClick={() => !initial && setType('link')} className={`flex-1 rounded px-2 py-1.5 text-[11px] font-semibold ${type === 'link' ? 'bg-white text-[#235b3e] shadow-sm' : 'text-slate-500'}`}>Enlace externo</button></div><div className="grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-[11px] font-semibold text-slate-700">Título *<input required value={values.title} onChange={(event) => set('title', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal" placeholder="Ej: Presentación comercial" /></label><label className="grid gap-1 text-[11px] font-semibold text-slate-700">Categoría<select value={values.category} onChange={(event) => set('category', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal"><option value="">Seleccionar</option>{categoryLabels.map((category) => <option key={category}>{category}</option>)}</select></label></div>{!initial && type === 'file' && <label className="grid gap-1 text-[11px] font-semibold text-slate-700">Archivo *<input required type="file" onChange={(event) => setFile(event.target.files?.[0])} accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal" /></label>}{type === 'link' && <label className="grid gap-1 text-[11px] font-semibold text-slate-700">URL *<input required type="url" pattern="https?://.*" value={values.external_url} onChange={(event) => set('external_url', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal" placeholder="https://empresa.cl/material" /></label>}<label className="grid gap-1 text-[11px] font-semibold text-slate-700">Descripción<textarea rows={3} value={values.description} onChange={(event) => set('description', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal" /></label><div className="grid gap-3 md:grid-cols-2"><label className="grid gap-1 text-[11px] font-semibold text-slate-700">Visibilidad<select value={values.visibility} onChange={(event) => set('visibility', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal"><option value="directory">Directorio · Red autorizada</option><option value="assigned_only">Sólo asignados</option><option value="admin_only">Sólo Arista</option></select></label><label className="grid gap-1 text-[11px] font-semibold text-slate-700">Orden<input type="number" value={values.sort_order} onChange={(event) => set('sort_order', event.target.value)} className="rounded-md border border-[#c9c1b4] px-2.5 py-2 text-[12px] font-normal" /></label></div><div className="sticky bottom-[-1.5rem] flex justify-end gap-2 border-t border-[#eee8dd] bg-white py-3"><button type="button" onClick={onClose} className="rounded-md border border-[#c9c1b4] px-3 py-1.5 text-[11px] font-semibold">Cancelar</button><button disabled={saving} className="inline-flex items-center gap-1.5 rounded-md bg-[#235b3e] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60">{saving ? 'Guardando...' : initial ? 'Guardar cambios' : 'Agregar material'}</button></div></form></AdminDetailModal>
}

function MaterialPreview({ material, onClose, onDownload, onError }: { material: RepresentedCompanyMaterialRecord; onClose: () => void; onDownload: () => void; onError: (message: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(material.material_type === 'file')
  useEffect(() => { if (material.material_type === 'file') void adminRepository.createRepresentedCompanyMaterialSignedUrl(material.id).then((result) => { setLoading(false); if (result.error) onError(errorText(result.error)); else setUrl(result.data) }) }, [material.id, material.material_type, onError])
  return <AdminDetailModal title={material.title} subtitle={`${material.category || 'Material comercial'} · ${visibilityLabels[material.visibility]}`} onClose={onClose} size="large"><div className="grid gap-3"><div className="flex items-center justify-between gap-2 rounded-md bg-[#fbfaf7] px-3 py-2 text-[11px] text-slate-600"><span>{material.material_type === 'link' ? material.external_url : `${material.file_name || 'Archivo'}${material.file_size ? ` · ${sizeLabel(material.file_size)}` : ''}`}</span><div className="flex gap-1"><button type="button" onClick={onDownload} className="inline-flex items-center gap-1 rounded-md border border-[#c9c1b4] px-2 py-1 font-semibold text-[#235b3e]"><Download size={13} />Descargar</button>{material.material_type === 'link' && <a href={material.external_url ?? '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-[#c9c1b4] px-2 py-1 font-semibold text-[#235b3e]"><ExternalLink size={13} />Abrir enlace</a>}</div></div>{loading && <p className="py-12 text-center text-[12px] text-slate-500">Cargando vista previa...</p>}{!loading && material.material_type === 'link' && <p className="rounded-md border border-[#ddd6ca] bg-[#fbfaf7] p-5 text-center text-[12px] text-slate-600">Este material es un enlace externo. Ábrelo en una pestaña segura para continuar.</p>}{!loading && url && material.mime_type === 'application/pdf' && <iframe title={`Vista previa de ${material.title}`} src={url} className="h-[70vh] w-full rounded-md border border-[#ddd6ca]" />}{!loading && url && material.mime_type?.startsWith('image/') && <div className="flex min-h-[50vh] items-center justify-center rounded-md bg-slate-100 p-4"><img src={url} alt={material.title} className="max-h-[68vh] max-w-full object-contain" /></div>}{!loading && url && material.mime_type && !['application/pdf'].includes(material.mime_type) && !material.mime_type.startsWith('image/') && <p className="rounded-md border border-[#ddd6ca] bg-[#fbfaf7] p-5 text-center text-[12px] text-slate-600">No hay vista previa disponible para este formato. Puedes descargarlo o abrir el archivo.</p>}</div></AdminDetailModal>
}
