export function parseCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]) {
  return Boolean(origin && allowedOrigins.includes(origin))
}

export function corsHeaders(origin: string | null, allowedOrigins: string[]) {
  return {
    ...(isAllowedOrigin(origin, allowedOrigins) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  }
}
