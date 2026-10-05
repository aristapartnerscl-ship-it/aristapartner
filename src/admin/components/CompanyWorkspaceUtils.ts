const structuredDelimiter = /[;\n\u2022\u00b7]/

function cleanItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

export function splitCommercialItems(value: string | null | undefined) {
  return cleanItems((value ?? '').split(/\s*(?:;|\n|\u2022|\u00b7)\s*/))
}

export function extractCommercialItems(value: string | null | undefined) {
  const text = value?.trim() ?? ''
  return text.length > 0 && structuredDelimiter.test(text) ? splitCommercialItems(text) : []
}

export function extractProblemItems(value: string | null | undefined) {
  const text = value?.trim() ?? ''
  if (!text) return []
  const source = text.includes(':') ? text.slice(text.indexOf(':') + 1) : text
  const items = cleanItems(source.split(/\s*(?:,|;|\n|\u2022|\u00b7)\s*/)).filter((item) => item.length <= 72)
  return items.length > 1 ? items : [text]
}

export function extractFirstQuestion(value: unknown) {
  if (!Array.isArray(value)) return ''
  const text = value.find((item): item is string => typeof item === 'string' && item.trim().length > 0) ?? ''
  const match = text.match(/¿[^?]+\?/u)
  return match?.[0] ?? text.split(/\n|(?<=\?)\s*/)[0].trim()
}
