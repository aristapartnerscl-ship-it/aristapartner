import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getElementBySafeHash } from '../utils/hash-anchor'

export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const target = getElementBySafeHash(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        target.focus({ preventScroll: true })
      }
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    window.requestAnimationFrame(() => document.getElementById('contenido')?.focus({ preventScroll: true }))
  }, [hash, pathname])

  return null
}
