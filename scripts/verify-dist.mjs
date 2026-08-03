import { readdir, readFile } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'

const root = resolve(process.cwd(), process.argv[2] ?? 'dist')
const mode = process.argv[3] ?? 'unknown'
const allowedGeneratedReferences = [
  /^https:\/\/react\.dev\/errors\//,
  /^https:\/\/reactrouter\.com\/en\/main\/routers\/picking-a-router\.$/,
  /^https:\/\/bit\.ly\/wb-precache$/,
  /^http:\/\/localhost$/,
  /^http:\/\/www\.w3\.org\/(2000\/svg|1998\/Math\/MathML|1999\/xlink|XML\/1998\/namespace)$/,
]
const allowedLocalReferences = mode === 'local' ? [/^https:\/\/jira\.local\//, /^https:\/\/review\.local\//] : []
const files = []

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else files.push(path)
  }
}

await walk(root)
const references = []
for (const file of files) {
  if (!['.html', '.js', '.css', '.json', '.svg'].includes(extname(file).toLowerCase())) continue
  const content = await readFile(file, 'utf8')
  for (const match of content.matchAll(/https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+\-=%]+/g)) references.push({ file, url: match[0] })
}
const unexpected = references.filter(({ url }) => ![...allowedGeneratedReferences, ...allowedLocalReferences].some((pattern) => pattern.test(url)))
if (unexpected.length) {
  console.error(`External-resource audit failed for ${mode} build:`)
  for (const item of unexpected) console.error(`- ${item.url} in ${item.file}`)
  process.exit(1)
}
console.log(`External-resource audit passed for ${mode} build: ${files.length} generated files, ${references.length} documented local link reference(s).`)
