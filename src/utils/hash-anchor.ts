const authHashParameterPattern = /(^|&)(error|error_code|access_token|refresh_token|type)=/i

function decodeHashId(rawId: string) {
  try {
    return decodeURIComponent(rawId)
  } catch {
    return null
  }
}

export function getElementBySafeHash(hash: string, root: Document = document) {
  if (!hash.startsWith('#') || hash.length <= 1) return null

  const rawId = hash.slice(1)
  if (rawId.includes('&') || rawId.includes('=') || authHashParameterPattern.test(rawId)) return null

  const id = decodeHashId(rawId)
  if (!id || id.includes('&') || id.includes('=')) return null

  return root.getElementById(id)
}
