import type { Answers } from '../data'

export async function readLogo(file: File): Promise<NonNullable<Answers['logo']>> {
  const imageData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  const image = new Image()
  image.src = imageData
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, 64, 64)
  const { data } = ctx.getImageData(0, 0, 64, 64)
  const histogram = new Map<string, { count: number; sum: number[] }>()
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 100) continue
    const rgb = [data[i], data[i + 1], data[i + 2]]
    const key = rgb.map(channel => channel >> 5).join(',')
    const bucket = histogram.get(key) ?? { count: 0, sum: [0, 0, 0] }
    bucket.count++
    rgb.forEach((channel, index) => { bucket.sum[index] += channel })
    histogram.set(key, bucket)
  }
  const colors = [...histogram.values()].sort((a, b) => b.count - a.count).slice(0, 3)
    .map(({ count, sum }) => '#' + sum.map(channel => Math.round(channel / count).toString(16).padStart(2, '0')).join(''))
  return { name: file.name, width: image.naturalWidth, height: image.naturalHeight, colors,
    ...(file.size <= 200 * 1024 ? { image: imageData } : {}) }
}
