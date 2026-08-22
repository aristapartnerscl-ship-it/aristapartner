import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const outputPath = resolve('src/types/supabase.generated.ts')
const supabase = resolve('node_modules', 'supabase', 'dist', 'supabase.js')
const args = ['gen', 'types', 'typescript', '--linked', '--schema', 'public']

const generated = execFileSync(process.execPath, [supabase, ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
})

const header = `// -----------------------------------------------------------------------------\n// Auto-generated Supabase types for the linked Arista Partners project.\n// Do not edit manually. Regenerate with: npm run types:supabase\n// -----------------------------------------------------------------------------\n\n`

writeFileSync(outputPath, `${header}${generated}`, { encoding: 'utf8' })
