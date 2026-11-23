export const MAX_FILES = 150
export const MAX_BYTES = 300_000_000
const ORIGINAL_BYTES = 8_000_000

export interface Attachment {
  id: string
  name: string
  page: string
  kind: 'image' | 'logo' | 'pdf'
  size: number
  caption: string
}

export function safeName(name: string) {
  return Array.from(name.normalize('NFC').replace(/[^\p{L}\p{M}\p{N} ._()-]/gu, '_')
    .replace(/\s+/g, ' ').trim().replace(/^\.+|[. ]+$/g, '')).join('') || 'archivo'
}

export function planUpload(files: Attachment[]) {
  const used = new Set<string>()
  const entries = files.map(file => {
    const folder = file.kind === 'image' ? safeName(file.page) : file.kind === 'logo' ? 'Logo' : 'Documentos'
    const name = safeName(file.name)
    const dot = name.lastIndexOf('.')
    const hasExtension = dot > 0 && name.length - dot <= 12
    const extension = hasExtension ? name.slice(dot) : ''
    const stem = Array.from(hasExtension ? name.slice(0, dot) : name).slice(0, 100 - extension.length)
      .join('').replace(/[. ]+$/g, '')
    let filename = stem + extension
    let copy = 2
    while (used.has(`${folder}/${filename}`.toLowerCase())) filename = `${stem} (${copy++})${extension}`
    used.add(`${folder}/${filename}`.toLowerCase())
    return { ...file, folder, filename }
  })
  return { entries, overLimit: files.length > MAX_FILES || files.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES }
}

export function downscaleSize(width: number, height: number) {
  const scale = Math.min(1, 2400 / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

export const isHeic = (file: { name: string; type: string }) =>
  /\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type)

export async function prepareFile(file: Blob, name: string, kind: Attachment['kind']) {
  if (file.size < ORIGINAL_BYTES || kind === 'pdf') return file
  if (isHeic({ name, type: file.type })) throw new Error('Comparte los archivos HEIC grandes mediante un enlace.')
  const image = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    Object.assign(canvas, downscaleSize(image.width, image.height))
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('No se pudo reducir la imagen.')), 'image/webp', .85))
  } finally { image.close() }
}

export interface Receipt { filename: string; size: number }
export function buildManifest(files: ReturnType<typeof planUpload>['entries'], uploaded: Record<string, Receipt>, link = '') {
  return {
    archivos: files.flatMap(({ id, name, folder, page, kind, caption }, order) => {
      const receipt = uploaded[id]
      return receipt ? [{ original: name, ruta: `imagenes/${folder}/${receipt.filename}`, pagina: page,
        tipo: kind, pie: caption, orden: order + 1, bytes: receipt.size }] : []
    }),
    resumen: { total: files.length, subidos: files.filter(file => uploaded[file.id]).length, enlace: link.trim() },
  }
}
