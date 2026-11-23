type ReadFile<T> = (file: File, relativePath?: string) => Promise<T>
type ReadError = (name: string) => void

async function readEntry<T>(entry: FileSystemEntry, read: ReadFile<T>, onError: ReadError): Promise<T[]> {
  try {
    if (entry.isFile) {
      return await new Promise<T[]>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(file => {
          read(file, entry.fullPath.slice(1)).then(value => resolve([value]), reject)
        }, reject)
      })
    }
    const reader = (entry as FileSystemDirectoryEntry).createReader()
    const pending: Promise<T[]>[] = []
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject))
        .catch(() => { onError(entry.name); return [] })
      if (!batch.length) break
      pending.push(...batch.map(child => readEntry(child, read, onError)))
    }
    return (await Promise.all(pending)).flat()
  } catch {
    onError(entry.name)
    return []
  }
}

export async function droppedFiles<T>(transfer: DataTransfer, read: ReadFile<T>, onError: ReadError) {
  const entries = Array.from(transfer.items).flatMap(item => {
    const entry = item.webkitGetAsEntry?.()
    return entry ? [entry] : []
  })
  return entries.length
    ? (await Promise.all(entries.map(entry => readEntry(entry, read, onError)))).flat()
    : Promise.all(Array.from(transfer.files, file => read(file)))
}
