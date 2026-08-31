export type LegalDocumentMeta = {
  effectiveDate?: string
  version?: string
}

export type LegalConfig = {
  commercialName: string
  legalName?: string
  rut?: string
  legalAddress?: string
  country: string
  generalEmail?: string
  privacyEmail?: string
  privacy: LegalDocumentMeta
  terms: LegalDocumentMeta
  legalDocumentsDraft: boolean
}

export const legalConfig: LegalConfig = {
  commercialName: 'Arista Partners',
  legalName: 'Arista Partners SpA',
  rut: '',
  legalAddress: '',
  country: 'Chile',
  generalEmail: publicContact.email,
  privacyEmail: publicContact.email,
  privacy: {
    effectiveDate: '22 de agosto de 2026',
    version: '1.0',
  },
  terms: {
    effectiveDate: '22 de agosto de 2026',
    version: '1.0',
  },
  legalDocumentsDraft: false,
}

export const showDevelopmentLegalNotes = import.meta.env.DEV

export function configuredLegalFields() {
  return [
    ['Nombre comercial', legalConfig.commercialName],
    ['Nombre legal o razón social', legalConfig.legalName],
    ['RUT', legalConfig.rut],
    ['Domicilio o ubicación legal', legalConfig.legalAddress],
    ['País', legalConfig.country],
    ['Correo general', legalConfig.generalEmail],
    ['Correo para datos personales', legalConfig.privacyEmail],
  ].filter(([, value]) => Boolean(value))
}

export function hasPendingLegalIdentity() {
  return !legalConfig.legalName
}
import { publicContact } from './contact'
