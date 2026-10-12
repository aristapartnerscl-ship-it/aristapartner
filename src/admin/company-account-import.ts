import * as XLSX from 'xlsx'
import type { RepresentedCompanyAccountStatus } from '../types/admin'

export type AccountImportRow = Record<string, unknown>
export type AccountImportSheet = { name: string; status: RepresentedCompanyAccountStatus; rows: AccountImportRow[]; invalidRows: Array<{ row: number; reason: string; account_name?: string }>; source: 'csv' | 'xlsx' }

const emptyMarkers = new Set(['', 'n/a', 'na', 'sin informacion'])

export function normalizeImportLabel(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function cleanImportValue(value: unknown) {
  const text = String(value ?? '').trim()
  return emptyMarkers.has(normalizeImportLabel(text)) ? null : text
}

export function suggestImportStatus(sheetName: string): RepresentedCompanyAccountStatus {
  const name = normalizeImportLabel(sheetName)
  if (name.includes('clientes actuales')) return 'represented_client'
  if (name.includes('clientes rrhh') && name.includes('contactar')) return 'represented_lead'
  return 'represented_lead'
}

function mapRows(rawRows: unknown[][], sheetName: string, source: 'csv' | 'xlsx'): AccountImportSheet {
  const title = normalizeImportLabel(rawRows[0]?.[0])
  const isCurrentAccounts = title === 'clientes actuales' && (rawRows[0]?.length ?? 0) <= 2
  const rows = isCurrentAccounts ? rawRows.slice(1) : rawRows
  const normalizedHeaders = (rows[0] ?? []).map(normalizeImportLabel)
  const hasCompanyHeader = normalizedHeaders.some((header) => ['empresa', 'company', 'cliente', 'clientes'].includes(header))
  const dataRows = isCurrentAccounts || !hasCompanyHeader ? rows : rows.slice(1)
  const headers = isCurrentAccounts || !hasCompanyHeader ? ['empresa'] : normalizedHeaders
  const invalidRows: AccountImportSheet['invalidRows'] = []
  const mapped = dataRows.map((values, index) => {
    const get = (...names: string[]) => {
      const headerIndex = headers.findIndex((header) => names.includes(header))
      return cleanImportValue(values[headerIndex >= 0 ? headerIndex : -1])
    }
    const accountName = String(get('empresa', 'company', 'cliente', 'clientes') ?? '').trim()
    const email = get('email contacto', 'email', 'correo')
    if (!accountName) {
      invalidRows.push({ row: index + 2, reason: 'Falta Empresa.' })
      return null
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      invalidRows.push({ row: index + 2, account_name: accountName, reason: 'Email invalido; corrigelo antes de importar.' })
      return null
    }
    return { account_name: accountName, contact_name: [get('nombre'), get('apellido')].filter(Boolean).join(' ') || null, contact_phone: get('fono', 'telefono'), contact_email: email, next_followup_at: get('seguimiento'), territory: get('region') }
  }).filter((row): row is Exclude<typeof row, null> => row !== null)
  return { name: sheetName, status: suggestImportStatus(sheetName), rows: mapped, invalidRows, source }
}

export function parseCsvImport(text: string): AccountImportSheet {
  const rows: string[][] = []
  let row: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (char === ',' && !quoted) { row.push(cell.trim()); cell = ''; continue }
    if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; continue }
    cell += char
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row)
  return mapRows(rows, 'Archivo CSV', 'csv')
}

export function parseXlsxImport(data: ArrayBuffer): AccountImportSheet[] {
  const workbook = XLSX.read(data, { type: 'array', cellText: true, cellDates: false })
  return workbook.SheetNames.map((name) => mapRows(XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: false, defval: '' }), name, 'xlsx'))
}
