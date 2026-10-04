import { access, readFile, rm } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
if (!pkg.scripts.build?.includes('next build') || resolve(process.cwd()) !== root) {
  throw new Error('Run npm run clean from the Splitly project root.')
}
for (const lock of ['.next/dev/lock', '.next/lock']) {
  try {
    await access(join(root, lock))
  } catch {
    continue
  }
  throw new Error(
    'Stop next dev/build before cleaning .next. If a crashed process left a lock, verify it is stopped first.',
  )
}
for (const name of [
  '.next',
  'out',
  'dist',
  'coverage',
  'test-results',
  'playwright-report',
  'tsconfig.tsbuildinfo',
  'next-env.d.ts',
]) {
  const target = resolve(root, name)
  if (!target.startsWith(root + sep)) {
    throw new Error('Clean target is outside the project.')
  }
  await rm(target, { recursive: true, force: true })
  console.log(`Removed ${name}`)
}
