function doGet() {
  return jsonResponse({ ok: true })
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  try {
    const data = JSON.parse(e.postData.contents)
    if (typeof data.filename !== 'string' || !/^\d{4}-\d{2}-\d{2}-[a-z0-9-]{1,80}$/.test(data.filename) ||
        typeof data.markdown !== 'string' || typeof data.json !== 'string' ||
        data.markdown.length > 100000 || data.json.length > 500000) {
      return jsonResponse({ ok: false, error: 'Solicitud no válida' })
    }

    JSON.parse(data.json)
    lock.waitLock(10000)
    const folders = DriveApp.getFoldersByName('Encargos')
    const root = folders.hasNext() ? folders.next() : DriveApp.createFolder('Encargos')
    const matches = root.getFoldersByName(data.filename)
    while (matches.hasNext()) {
      const match = matches.next()
      if (matchesFile(match, data.filename + '.md', data.markdown) &&
          matchesFile(match, data.filename + '.json', data.json)) return jsonResponse({ ok: true })
    }

    const folder = root.createFolder(data.filename)
    try {
      folder.createFile(Utilities.newBlob(data.markdown, 'text/markdown', data.filename + '.md'))
      folder.createFile(Utilities.newBlob(data.json, 'application/json', data.filename + '.json'))
    } catch (error) {
      folder.setTrashed(true)
      throw error
    }
    return jsonResponse({ ok: true })
  } catch (error) {
    return jsonResponse({ ok: false, error: 'No se pudo guardar el encargo' })
  } finally {
    if (lock.hasLock()) lock.releaseLock()
  }
}

function matchesFile(folder, name, content) {
  const files = folder.getFilesByName(name)
  return files.hasNext() && files.next().getBlob().getDataAsString('UTF-8') === content
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}
