const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function isValidSupabaseUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
  } catch {
    return false
  }
}

function isRecognizedSupabaseKey(value: string) {
  return value.startsWith('sb_publishable_') || value.startsWith('eyJ')
}

const diagnostics = {
  urlPresent: supabaseUrl.length > 0,
  publishableKeyPresent: supabasePublishableKey.length > 0,
  urlFormatValid: isValidSupabaseUrl(supabaseUrl),
  keyFormatRecognized: isRecognizedSupabaseKey(supabasePublishableKey),
}

if (import.meta.env.DEV) {
  console.info('Supabase configuration diagnostics', {
    'URL presente': diagnostics.urlPresent ? 'sí' : 'no',
    'Publishable key presente': diagnostics.publishableKeyPresent ? 'sí' : 'no',
    'Formato de URL válido': diagnostics.urlFormatValid ? 'sí' : 'no',
    'Formato de clave reconocido': diagnostics.keyFormatRecognized ? 'sí' : 'no',
  })
}

export const supabaseConfig = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
}

export const isSupabaseConfigured =
  diagnostics.urlPresent &&
  diagnostics.publishableKeyPresent &&
  diagnostics.urlFormatValid &&
  diagnostics.keyFormatRecognized
