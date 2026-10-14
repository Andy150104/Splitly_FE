import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import prettier from 'prettier'

const root = path.resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)
const modules = new Map()

// Render the small, presentational TSX tree without requiring a second build tool.
async function componentModule(filename) {
  if (modules.has(filename)) return modules.get(filename)
  let { outputText } = ts.transpileModule(await readFile(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
  })
  for (const match of outputText.matchAll(/from (['"])([^'"]+)\1/g)) {
    const specifier = match[2]
    const resolved = specifier.startsWith('.')
      ? await componentModule(path.resolve(path.dirname(filename), `${specifier}.tsx`))
      : pathToFileURL(require.resolve(specifier)).href
    outputText = outputText.replace(match[0], `from ${JSON.stringify(resolved)}`)
  }
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
  modules.set(filename, url)
  return url
}

const { default: OfflineScreen } = await import(
  await componentModule(path.join(root, 'src/components/ui/OfflineScreen.tsx'))
)
const template = await readFile(path.join(root, 'scripts/offline-template.html'), 'utf8')
const document = template.replace(
  '<!-- SPLITLY_OFFLINE_SCREEN -->',
  renderToStaticMarkup(createElement(OfflineScreen)),
)
await writeFile(
  path.join(root, 'public/offline.html'),
  await prettier.format(document, {
    ...(await prettier.resolveConfig(path.join(root, 'public/offline.html'))),
    parser: 'html',
  }),
)

await mkdir(path.join(root, 'public/offline-fonts'), { recursive: true })
for (const [family, weight] of [
  ['be-vietnam-pro', 400],
  ['barlow-condensed', 700],
]) {
  for (const subset of ['latin', 'vietnamese']) {
    const filename = `${family}-${subset}-${weight}-normal.woff2`
    await copyFile(
      path.join(root, 'node_modules/@fontsource', family, 'files', filename),
      path.join(root, 'public/offline-fonts', filename),
    )
  }
}
console.log('Generated offline screen and local brand fonts.')
