export function downloadFile(name: string, type: string, content: string) {
  const href = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = href
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
