import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { levelsFor, recommendTipo } from '../../src/showcase/encargo/lib/levels'
import { buildPrompt } from '../../src/showcase/encargo/lib/prompt'
import { buildManifest, downscaleSize, MAX_BYTES, planUpload, safeName, type Attachment } from '../../src/showcase/encargo/lib/upload'

const attachment: Attachment = { id: 'one', name: 'Árbol grande.jpg', page: 'Carta/Menú', kind: 'image', size: 120, caption: 'El jardín' }

describe('Encargo v2', () => {
  it('unlocks the admin and functionality levels only for matching types', () => {
    expect(levelsFor(1)).toEqual([0, 1, 2, 3, 4, 7, 8])
    expect(levelsFor(2)).toEqual([0, 1, 2, 3, 4, 5, 7, 8])
    expect(levelsFor(3)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(levelsFor(4)).toEqual(levelsFor(3))
  })

  it.each([
    [false, false, false, 1], [true, false, false, 2],
    [false, true, false, 3], [true, true, false, 3], [false, false, true, 4], [true, true, true, 4],
  ])('recommends the most capable applicable type for %s/%s/%s', (edit, features, platform, tipo) => {
    expect(recommendTipo({ edit, features, platform })).toBe(tipo)
  })

  it('builds a brief with page copy, delegated text, files and type-specific requirements', () => {
    const prompt = buildPrompt({
      tipo: 4, pages: ['Carta/Menú'], pageSections: { 'Carta/Menú': 'Temporada' },
      content: { 'Carta/Menú': { headline: { text: 'Carta de otoño' }, body: { studio: true, text: 'Borrador' } } },
      files: [attachment], editable: ['Galerías'], admins: '2', features: ['Pagos'],
      roles: 'Vendedor', permissions: 'Publicar artículos', marketplace: 'Sí', sellers: 'Por invitación',
      commissions: 'Por operación', integrations: 'Sistema de cobro', shareLink: 'https://example.com/fotos',
    })
    for (const text of ['4 · Plataforma', 'Temporada', 'Carta de otoño', 'Lo escribe el estudio', 'Galerías', 'Administradores: 2',
      'Pagos', 'Vendedor', 'Publicar artículos', 'Por invitación', 'Por operación', 'Sistema de cobro', 'El jardín',
      'imagenes/Carta_Menú/Árbol grande.jpg', 'https://example.com/fotos']) expect(prompt).toContain(text)
    expect(prompt).not.toMatch(/Borrador|undefined|presupuesto/i)
    const simple = buildPrompt({ tipo: 1, editable: ['Galerías'], features: ['Pagos'], roles: 'Vendedor' })
    expect(simple).not.toMatch(/Galerías|Pagos|Vendedor|Contenido editable/)
  })

  it('keeps accents and spaces, sanitizes separators and allocates one stable destination per file', () => {
    const files = [attachment, { ...attachment, id: 'two', name: 'A\u0301rbol grande.jpg' },
      { ...attachment, id: 'three', name: 'Árbol grande (2).jpg' }, { ...attachment, id: 'four', page: 'Inicio' }]
    expect(safeName('  ../Carta de otoño?.pdf  ')).toBe('_Carta de otoño_.pdf')
    const longName = `${'Á'.repeat(110)}.jpg`
    expect(planUpload([{ ...attachment, name: longName }]).entries[0].filename).toMatch(/^Á{96}\.jpg$/)
    const { entries } = planUpload(files)
    expect(entries.map(({ filename }) => filename)).toEqual([
      'Árbol grande.jpg', 'Árbol grande (2).jpg', 'Árbol grande (2) (2).jpg', 'Árbol grande.jpg',
    ])
    const server = readFileSync(new URL('../../docs/encargo/apps-script/Code.gs', import.meta.url), 'utf8')
    for (const { folder, filename } of entries) {
      expect(runInNewContext(server + '\nsafeName(nombre)', { nombre: folder })).toBe(folder)
      expect(runInNewContext(server + '\nsafeName(nombre)', { nombre: filename })).toBe(filename)
    }
  })

  it('enforces both limits and scales the long side without enlarging small images', () => {
    const files = Array.from({ length: 150 }, (_, index) => ({ ...attachment, id: String(index), size: MAX_BYTES / 150 }))
    expect(planUpload(files).overLimit).toBe(false)
    expect(planUpload([...files.map(file => ({ ...file, size: 0 })), attachment]).overLimit).toBe(true)
    expect(planUpload([{ ...attachment, size: MAX_BYTES + 1 }]).overLimit).toBe(true)
    expect(downscaleSize(4800, 1200)).toEqual({ width: 2400, height: 600 })
    expect(downscaleSize(1200, 4800)).toEqual({ width: 600, height: 2400 })
    expect(downscaleSize(600, 800)).toEqual({ width: 600, height: 800 })
  })

  it('builds the manifest in display order with confirmed names and sizes', () => {
    const files = planUpload([{ ...attachment, id: 'pending' }, attachment]).entries
    expect(buildManifest(files, { one: { filename: 'Árbol grande (2).webp', size: 80 } }, ' https://example.com ')).toEqual({
      archivos: [{
        original: 'Árbol grande.jpg', ruta: 'imagenes/Carta_Menú/Árbol grande (2).webp', pagina: 'Carta/Menú',
        tipo: 'image', pie: 'El jardín', orden: 2, bytes: 80,
      }],
      resumen: { total: 2, subidos: 1, enlace: 'https://example.com' },
    })
  })
})

it('writes distinct Drive files with their original accents and spaces and reuses them on retry', () => {
  type Blob = { name: string; content: string | Uint8Array }
  class Folder {
    folders = new Map<string, Folder>()
    files = new Map<string, Blob & { getSize: () => number }>()

    createFolder(name: string) {
      const folder = new Folder()
      this.folders.set(name, folder)
      return folder
    }

    getFoldersByName(name: string) { return lookup(this.folders, name) }
    getFilesByName(name: string) { return lookup(this.files, name) }
    createFile(blob: Blob) {
      const file = { ...blob, getSize: () => blob.content.length }
      this.files.set(blob.name, file)
      return file
    }
  }
  const lookup = <T>(items: Map<string, T>, name: string) =>
    ({ hasNext: () => items.has(name), next: () => items.get(name) })
  const DriveApp = new Folder()
  const server = readFileSync(new URL('../../docs/encargo/apps-script/Code.gs', import.meta.url), 'utf8')
  const doPost = runInNewContext(server + '\ndoPost', {
    DriveApp,
    LockService: { getScriptLock: () => ({ waitLock() {}, hasLock: () => true, releaseLock() {} }) },
    Utilities: {
      newBlob: (content: Blob['content'], _mime: string, name: string) => ({ content, name }),
      base64Decode: (data: string) => Buffer.from(data, 'base64'),
    },
    ContentService: {
      createTextOutput: (content: string) => ({ setMimeType: () => JSON.parse(content) }),
      MimeType: { JSON: 'application/json' },
    },
  })
  const name = '2026-11-23-taller'
  const session = '12345678-1234-4321-8234-123456789012'
  const post = (action: string, details: object) =>
    doPost({ postData: { contents: JSON.stringify({ action, name, session, ...details }) } })
  expect(post('create', { markdown: '# Encargo', json: '{}' })).toMatchObject({ ok: true, version: 2 })
  const { entries } = planUpload([attachment, { ...attachment, id: 'two' }])
  const uploaded: Record<string, { filename: string; size: number }> = {}
  for (const entry of [...entries, entries[0]]) {
    const result = post('upload', { filename: entry.filename, folder: entry.folder, mime: 'image/jpeg', base64: 'YQ==' })
    expect(result).toMatchObject({ ok: true, filename: entry.filename, size: 1 })
    uploaded[entry.id] = result
  }
  expect(post('finish', { manifest: buildManifest(entries, uploaded) })).toMatchObject({ ok: true })
  const project = [...DriveApp.folders.get('Encargos')!.folders.values()][0]
  const images = project.folders.get('imagenes')!.folders.get('Carta_Menú')!
  expect([...images.files.keys()]).toEqual(['Árbol grande.jpg', 'Árbol grande (2).jpg'])
  expect([...project.files.keys()]).toEqual(['encargo.md', 'encargo.json', 'manifiesto.json'])
})
