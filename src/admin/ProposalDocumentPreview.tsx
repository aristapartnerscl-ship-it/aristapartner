import type { ProposalDocumentModel } from './proposal-document'
import { formatProposalMoney } from './proposal-document'

export function ProposalDocumentPreview({ document }: { document: ProposalDocumentModel }) {
  return <article className="mx-auto w-full max-w-3xl bg-white p-6 text-[#17202d] shadow-sm ring-1 ring-slate-200 sm:p-10" aria-label="Vista previa de propuesta">
    <header className="border-b-4 border-[#235b3e] pb-6">
      <p className="text-lg font-bold tracking-[0.18em] text-[#235b3e]">{document.organization.displayName}</p>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Propuesta comercial</p>
      <h2 className="mt-2 text-2xl font-semibold">{document.code} · Versión {document.version}</h2>
      <p className="mt-3 text-sm text-slate-600">{document.issuedAt}{document.validUntil ? ` · Válida hasta ${document.validUntil}` : ''}</p>
    </header>
    <section className="grid gap-5 border-b border-slate-200 py-7 sm:grid-cols-2">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preparada para</p><p className="mt-2 text-lg font-semibold">{document.counterparty ?? 'Contraparte no especificada'}</p>{document.contactName && <p className="mt-1 text-sm text-slate-600">Contacto: {document.contactName}</p>}</div>
      <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Relación comercial</p><p className="mt-2 text-sm">{document.opportunityTitle ?? 'Oportunidad comercial'}</p>{document.opportunityType && <p className="mt-1 text-sm text-slate-600">Tipo: {document.opportunityType}</p>}</div>
    </section>
    <section className="grid gap-5 py-7">
      {document.description && <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Descripción</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{document.description}</p></div>}
      <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Propuesta comercial</h3><p className="mt-2 text-sm leading-6">Alcance y condiciones según la oportunidad comercial relacionada.</p></div>
      <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Inversión</h3><dl className="mt-3 grid max-w-md gap-2 text-sm"><div className="flex justify-between gap-4"><dt>Subtotal</dt><dd>{formatProposalMoney(document.subtotal, document.currency)}</dd></div><div className="flex justify-between gap-4"><dt>Impuesto ({document.taxPercentage}%)</dt><dd>{formatProposalMoney(document.taxAmount, document.currency)}</dd></div><div className="mt-2 flex justify-between gap-4 border-t-2 border-[#235b3e] pt-3 text-base font-bold"><dt>Total</dt><dd>{formatProposalMoney(document.totalAmount, document.currency)}</dd></div></dl></div>
      {document.validUntil && <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vigencia</h3><p className="mt-2 text-sm">Esta propuesta es válida hasta {document.validUntil}.</p></div>}
      {document.clientNotes && <div><h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Notas comerciales</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{document.clientNotes}</p></div>}
    </section>
    <footer className="border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
      <p>{document.companyName ?? document.organization.displayName}</p>
      <p>{[document.organization.email, document.organization.phone, document.organization.website].filter(Boolean).join(' · ')}</p>
      <p>{[document.organization.address, document.organization.cityRegion, document.organization.country].filter(Boolean).join(' · ')}</p>
    </footer>
  </article>
}
