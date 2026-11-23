function doGet() {
  return jsonResponse({ ok: true, version: 2 })
}

function safeName(name) {
  return Array.from(name.normalize('NFC').replace(/[^\p{L}\p{M}\p{N} ._()-]/gu, '_')
    .replace(/\s+/g, ' ').trim().replace(/^\.+|[. ]+$/g, '')).slice(0, 150).join('') || 'archivo'
}

function folderIn(parent, name) {
  const folders = parent.getFoldersByName(name)
  return folders.hasNext() ? folders.next() : parent.createFolder(name)
}

function putText(folder, name, text, mime) {
  if (!folder.getFilesByName(name).hasNext()) folder.createFile(Utilities.newBlob(text, mime, name))
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  try {
    const data = JSON.parse(e.postData.contents)
    const validName = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,80}$/.test(data.name)
    const validId = typeof data.session === 'string' && /^[a-f0-9-]{36}$/.test(data.session)
    if (!validName || !validId || !['create', 'upload', 'finish'].includes(data.action)) {
      return jsonResponse({ ok: false, version: 2, error: 'Solicitud no válida.' })
    }
    lock.waitLock(10000)
    const root = folderIn(DriveApp, 'Encargos')
    const name = data.name + '-' + data.session
    if (data.action === 'create') {
      if (typeof data.markdown !== 'string' || typeof data.json !== 'string' ||
          data.markdown.length > 1500000 || data.json.length > 2000000) throw new Error('Brief no válido')
      JSON.parse(data.json)
      const folder = folderIn(root, name)
      putText(folder, 'encargo.md', data.markdown, 'text/markdown')
      putText(folder, 'encargo.json', data.json, 'application/json')
    } else {
      const folders = root.getFoldersByName(name)
      if (!folders.hasNext()) throw new Error('Carpeta inexistente')
      const folder = folders.next()
      if (data.action === 'upload') {
        if (typeof data.base64 !== 'string' || data.base64.length > 16000000 ||
            typeof data.filename !== 'string' || typeof data.folder !== 'string' ||
            typeof data.mime !== 'string') throw new Error('Archivo no válido')
        const target = folderIn(folderIn(folder, 'imagenes'), safeName(data.folder))
        // El cliente asigna nombres únicos y estables antes del primer intento.
        const filename = safeName(data.filename)
        const files = target.getFilesByName(filename)
        const file = files.hasNext() ? files.next() :
          target.createFile(Utilities.newBlob(Utilities.base64Decode(data.base64), data.mime, filename))
        return jsonResponse({ ok: true, version: 2, filename, size: file.getSize() })
      }
      if (!data.manifest || !Array.isArray(data.manifest.archivos) || data.manifest.archivos.length > 150) {
        throw new Error('Manifiesto no válido')
      }
      putText(folder, 'manifiesto.json', JSON.stringify(data.manifest, null, 2), 'application/json')
    }
    return jsonResponse({ ok: true, version: 2 })
  } catch (error) {
    return jsonResponse({ ok: false, version: 2, error: 'No se pudo guardar el encargo o el archivo.' })
  } finally {
    if (lock.hasLock()) lock.releaseLock()
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}
