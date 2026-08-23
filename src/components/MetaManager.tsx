import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { publicSiteUrl, siteMeta } from '../data/site'

type MetaKey = keyof typeof siteMeta.pages

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null
  if (!element) {
    element = selector.startsWith('link') ? document.createElement('link') : document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

export function MetaManager() {
  const location = useLocation()

  useEffect(() => {
    const key = (siteMeta.pages[location.pathname as MetaKey] ? location.pathname : '/404') as MetaKey
    const page = siteMeta.pages[key]
    const title = page.title
    const description = page.description

    document.title = title
    upsertMeta('meta[name="description"]', { name: 'description', content: description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description })
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' })
    upsertMeta('meta[name="theme-color"]', { name: 'theme-color', content: siteMeta.themeColor })
    upsertMeta('link[rel="icon"][sizes="32x32"]', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/brand/arista-app-icon-v2-32.png' })

    const canonical = document.head.querySelector('link[rel="canonical"]')
    if (canonical) canonical.remove()
    if (publicSiteUrl) {
      const path = key === '/404' ? location.pathname : key
      upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: `${publicSiteUrl}${path}` })
      upsertMeta('meta[property="og:url"]', { property: 'og:url', content: `${publicSiteUrl}${path}` })
    }
  }, [location.pathname])

  return null
}
