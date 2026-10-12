import * as XLSX from 'xlsx'
import { describe, expect, test } from 'vitest'
import { cleanImportValue, normalizeImportLabel, parseCsvImport, parseXlsxImport, suggestImportStatus } from './company-account-import'

describe('company account import parsing', () => {
  test('keeps CSV support and maps empty markers to null', () => {
    const parsed = parseCsvImport('EMPRESA,NOMBRE,FONO,EMAIL CONTACTO\nEmpresa Ficticia,Alex,56965967032,N/A')
    expect(parsed.rows[0]).toMatchObject({ account_name: 'Empresa Ficticia', contact_name: 'Alex', contact_phone: '56965967032', contact_email: null })
  })

  test('detects known sheet names conservatively', () => {
    expect(suggestImportStatus('Clientes RRHH  Para contactar')).toBe('represented_lead')
    expect(suggestImportStatus('Clientes RRHH / Para contactar')).toBe('represented_lead')
    expect(suggestImportStatus('Clientes actuales')).toBe('represented_client')
    expect(normalizeImportLabel('  Clientes  Actuales ')).toBe('clientes actuales')
  })

  test('parses a workbook with leads and current accounts sheets', () => {
    const workbook = XLSX.utils.book_new()
    const leads = XLSX.utils.aoa_to_sheet([['EMPRESA', 'NOMBRE', 'APELLIDO', 'FONO', 'EMAIL CONTACTO', 'SEGUIMIENTO', 'REGIÓN'], ['Empresa Ficticia', 'Ana', 'Pérez', 56965967032, 'ana@example.test', '', 'Centro']])
    const clients = XLSX.utils.aoa_to_sheet([['Clientes actuales'], ['Cliente Ficticio A'], ['Cliente Ficticio B']])
    XLSX.utils.book_append_sheet(workbook, leads, 'Clientes RRHH  Para contactar')
    XLSX.utils.book_append_sheet(workbook, clients, 'Clientes actuales')
    const parsed = parseXlsxImport(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }))
    expect(parsed).toHaveLength(2)
    expect(parsed[0].status).toBe('represented_lead')
    expect(parsed[0].rows[0].contact_phone).toBe('56965967032')
    expect(parsed[1].status).toBe('represented_client')
    expect(parsed[1].rows.map((row) => row.account_name)).toEqual(['Cliente Ficticio A', 'Cliente Ficticio B'])
  })

  test('marks invalid email rows without logging or persisting them', () => {
    const parsed = parseCsvImport('EMPRESA,EMAIL CONTACTO\nEmpresa Ficticia,correo-invalido')
    expect(parsed.rows).toHaveLength(0)
    expect(parsed.invalidRows[0].reason).toContain('Email invalido')
    expect(cleanImportValue('Sin Información')).toBeNull()
  })
})
