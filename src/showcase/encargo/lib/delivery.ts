import { APPS_SCRIPT_URL } from '../config'

export class OldDeployment extends Error {}

export async function requestDelivery(data: Record<string, unknown>, demo: boolean) {
  if (demo) {
    await new Promise(resolve => setTimeout(resolve, 90))
    return { filename: data.filename, size: data.size }
  }
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(90_000),
  })
  if (!response.ok) throw new Error('El envío no está disponible ahora.')
  const result = await response.json()
  if (result.version !== 2) throw new OldDeployment('El envío a Drive necesita una actualización. Descarga el .md y envíalo por email con un enlace a tus archivos.')
  if (!result.ok) throw new Error(result.error || 'No se pudo enviar el encargo.')
  return result
}

export async function retryDelivery(data: Record<string, unknown>, demo: boolean) {
  for (let attempt = 0; ; attempt++) {
    try { return await requestDelivery(data, demo) }
    catch (error) {
      if (error instanceof OldDeployment || attempt === 2) throw error
      await new Promise(resolve => setTimeout(resolve, 450 * 2 ** attempt))
    }
  }
}

export function base64(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
