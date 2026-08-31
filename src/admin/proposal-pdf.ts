import type { jsPDF as JsPdf } from 'jspdf'
import type { ProposalDocumentModel } from './proposal-document'
import { formatProposalMoney, getProposalFileName } from './proposal-document'

const green = '#235b3e'
const navy = '#17202d'

async function loadLogo() {
  try {
    const response = await fetch('/brand/arista-logo-horizontal.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateProposalPdf(document: ProposalDocumentModel) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const width = pdf.internal.pageSize.getWidth()
  const height = pdf.internal.pageSize.getHeight()
  const margin = 18
  const logo = await loadLogo()
  let y = 18
  if (logo) pdf.addImage(logo, 'PNG', margin, y, 52, 13)
  else { pdf.setTextColor(green); pdf.setFontSize(15); pdf.setFont('helvetica', 'bold'); pdf.text(document.organization.displayName, margin, y + 8) }
  y += 30
  pdf.setDrawColor(green); pdf.setLineWidth(1.4); pdf.line(margin, y, width - margin, y)
  y += 12
  pdf.setTextColor(navy); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('PROPUESTA COMERCIAL', margin, y)
  y += 8; pdf.setFontSize(18); pdf.text(`${document.code} · Versión ${document.version}`, margin, y)
  y += 8; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor('#5b6573'); pdf.text(`${document.issuedAt}${document.validUntil ? ` · Válida hasta ${document.validUntil}` : ''}`, margin, y)
  y += 14
  y = section(pdf, 'Preparada para', document.counterparty ?? 'Contraparte no especificada', margin, y)
  if (document.contactName) y = line(pdf, `Contacto: ${document.contactName}`, margin, y)
  y += 4
  y = section(pdf, 'Relación comercial', `${document.opportunityTitle ?? 'Oportunidad comercial'}${document.opportunityType ? ` · ${document.opportunityType}` : ''}`, margin, y)
  if (document.description) y = paragraph(pdf, 'Descripción', document.description, margin, y)
  y = paragraph(pdf, 'Propuesta comercial', 'Alcance y condiciones según la oportunidad comercial relacionada.', margin, y)
  if (y > height - 95) { pdf.addPage(); y = 24 }
  y = section(pdf, 'Inversión', '', margin, y)
  y = line(pdf, `Subtotal                                      ${formatProposalMoney(document.subtotal, document.currency)}`, margin, y)
  y = line(pdf, `Impuesto (${document.taxPercentage}%)                          ${formatProposalMoney(document.taxAmount, document.currency)}`, margin, y)
  pdf.setDrawColor(green); pdf.setLineWidth(0.7); pdf.line(margin, y + 2, width - margin, y + 2)
  y += 10; pdf.setFont('helvetica', 'bold'); pdf.setTextColor(navy); pdf.text(`TOTAL                                         ${formatProposalMoney(document.totalAmount, document.currency)}`, margin, y)
  if (document.validUntil) y = paragraph(pdf, 'Vigencia', `Esta propuesta es válida hasta ${document.validUntil}.`, margin, y + 10)
  if (document.clientNotes) y = paragraph(pdf, 'Notas comerciales', document.clientNotes, margin, y)
  addFooter(pdf, document, margin, height, width)
  return { pdf, fileName: getProposalFileName(document.code, document.version) }
}

function section(pdf: JsPdf, label: string, value: string, x: number, y: number) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#5b6573'); pdf.text(label.toUpperCase(), x, y); if (value) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11); pdf.setTextColor(navy); pdf.text(value, x, y + 7); return y + 15 } return y + 8 }
function line(pdf: JsPdf, value: string, x: number, y: number) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(navy); pdf.text(value, x, y); return y + 7 }
function paragraph(pdf: JsPdf, label: string, value: string, x: number, y: number) { y += 8; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor('#5b6573'); pdf.text(label.toUpperCase(), x, y); y += 6; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(navy); const lines = pdf.splitTextToSize(value, 174); pdf.text(lines, x, y); return y + lines.length * 5 + 4 }
function addFooter(pdf: JsPdf, document: ProposalDocumentModel, margin: number, height: number, width: number) { const pages = pdf.getNumberOfPages(); for (let page = 1; page <= pages; page += 1) { pdf.setPage(page); pdf.setDrawColor('#d8dee5'); pdf.setLineWidth(0.3); pdf.line(margin, height - 20, width - margin, height - 20); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor('#5b6573'); const contact = [document.organization.email, document.organization.phone, document.organization.website].filter(Boolean).join(' · '); if (contact) pdf.text(contact, margin, height - 13); pdf.text(`Página ${page} de ${pages}`, width - margin, height - 13, { align: 'right' }) } }
