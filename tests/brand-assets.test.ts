import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, test } from 'vitest'

function projectFile(path: string) {
  return resolve(process.cwd(), path)
}

function readProjectFile(path: string) {
  return readFileSync(projectFile(path), 'utf8')
}

async function dimensions(path: string) {
  const metadata = await sharp(projectFile(path)).metadata()
  return { width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha }
}

async function cornerAlpha(path: string) {
  const metadata = await sharp(projectFile(path)).metadata()
  if (!metadata.width || !metadata.height) throw new Error(`Missing image dimensions for ${path}`)
  const buffer = await sharp(projectFile(path)).ensureAlpha().raw().toBuffer()
  return [
    [0, 0],
    [metadata.width - 1, 0],
    [0, metadata.height - 1],
    [metadata.width - 1, metadata.height - 1],
  ].map(([x, y]) => buffer[(y * metadata.width + x) * 4 + 3])
}

describe('brand logo and app icons', () => {
  test('includes the new versioned brand assets with expected dimensions', async () => {
    const expected = [
      ['public/brand/arista-symbol-v2.png', 1254, 1254, true],
      ['public/brand/arista-app-icon-v2-32.png', 32, 32, true],
      ['public/brand/arista-app-icon-v2-48.png', 48, 48, true],
      ['public/brand/arista-app-icon-v2-180.png', 180, 180, true],
      ['public/brand/arista-app-icon-v2-192.png', 192, 192, true],
    ] as const

    for (const [path, width, height, hasAlpha] of expected) {
      expect(statSync(projectFile(path)).size).toBeGreaterThan(0)
      await expect(dimensions(path)).resolves.toEqual({ width, height, hasAlpha })
    }
  })

  test('uses a rounded transparent favicon with fully transparent outside corners', async () => {
    const icons = [
      'public/brand/arista-app-icon-v2-32.png',
      'public/brand/arista-app-icon-v2-48.png',
      'public/brand/arista-app-icon-v2-180.png',
      'public/brand/arista-app-icon-v2-192.png',
    ]

    for (const icon of icons) {
      await expect(cornerAlpha(icon)).resolves.toEqual([0, 0, 0, 0])
    }
  })

  test('keeps symbol proportions square and rendered without distortion', async () => {
    const incoming = await dimensions('incoming-brand/arista-symbol-transparent.png')
    const published = await dimensions('public/brand/arista-symbol-v2.png')
    const lockup = readProjectFile('src/components/BrandLockup.tsx')
    const layout = readProjectFile('src/components/Layout.tsx')

    expect(published.width).toBe(incoming.width)
    expect(published.height).toBe(incoming.height)
    expect(lockup).toContain('src="/brand/arista-symbol-v2.png"')
    expect(lockup).toContain('w-auto')
    expect(lockup).toContain('object-contain')
    expect(layout).toContain('src="/brand/arista-symbol-v2.png"')
    expect(layout).toContain('object-contain')
  })

  test('references the new favicon set and removes active favicon references to the old symbol', () => {
    const html = readProjectFile('index.html')
    const metaManager = readProjectFile('src/components/MetaManager.tsx')
    const activeSources = [
      'index.html',
      'src/components/BrandLockup.tsx',
      'src/components/Layout.tsx',
      'src/components/MetaManager.tsx',
    ].map(readProjectFile).join('\n')

    expect(html).toContain('/brand/arista-app-icon-v2-32.png')
    expect(html).toContain('/brand/arista-app-icon-v2-48.png')
    expect(html).toContain('/brand/arista-app-icon-v2-180.png')
    expect(html).toContain('/brand/arista-app-icon-v2-192.png')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(metaManager).toContain('/brand/arista-app-icon-v2-32.png')
    expect(activeSources).not.toContain('/brand/arista-symbol.png')
    expect(activeSources).not.toContain('/favicon.png')
    expect(activeSources).not.toContain('/favicon.svg')
  })

  test('preserves the accessible Arista Partners brand name', () => {
    const lockup = readProjectFile('src/components/BrandLockup.tsx')
    const layout = readProjectFile('src/components/Layout.tsx')

    expect(lockup).toContain('alt="Arista Partners')
    expect(layout).toContain('Arista Partners')
  })
})
