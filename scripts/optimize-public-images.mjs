import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const imageDirectory = path.resolve('public/images')
const sources = [
  {
    name: 'arista-hero-intermediacion',
    widths: [960, 1600],
  },
  {
    name: 'arista-b2b-desarrollo',
    widths: [720, 1200],
  },
  {
    name: 'arista-proveedores-comparacion',
    widths: [720, 1200],
  },
  {
    name: 'arista-hero-intermediacion-v3',
    widths: [960, 1600],
  },
  {
    name: 'arista-hero-productos-b2b-v3',
    widths: [960, 1600],
  },
  {
    name: 'arista-hero-proveedores-v3',
    widths: [960, 1600],
  },
  {
    name: 'arista-hero-negociacion-v3',
    widths: [960, 1600],
  },
  {
    name: 'arista-hero-seguimiento-v3',
    widths: [960, 1600],
  },
]

async function optimizeVariant(sourcePath, outputPath, width, format) {
  let pipeline = sharp(sourcePath).rotate().resize({ width, fit: 'inside', withoutEnlargement: true })

  pipeline = format === 'webp'
    ? pipeline.webp({ quality: 82, effort: 5 })
    : pipeline.avif({ quality: 52, effort: 5 })

  await pipeline.toFile(outputPath)
  const metadata = await sharp(outputPath).metadata()
  const stats = await fs.stat(outputPath)

  return {
    file: path.relative(process.cwd(), outputPath).replaceAll(path.sep, '/'),
    width: metadata.width,
    height: metadata.height,
    bytes: stats.size,
  }
}

async function main() {
  const generated = []

  for (const source of sources) {
    const sourcePath = path.join(imageDirectory, `${source.name}.png`)
    try {
      await fs.access(sourcePath)
    } catch {
      throw new Error(`Missing required source image: ${sourcePath}`)
    }

    for (const width of source.widths) {
      for (const format of ['webp', 'avif']) {
        const outputPath = path.join(imageDirectory, `${source.name}-${width}.${format}`)
        generated.push(await optimizeVariant(sourcePath, outputPath, width, format))
      }
    }
  }

  console.table(generated.map((item) => ({ ...item, kb: Math.round(item.bytes / 1024) })))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Image optimization failed.')
  process.exitCode = 1
})
