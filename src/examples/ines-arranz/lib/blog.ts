export const categories = ['Ansiedad', 'Relaciones', 'Autoestima', 'Hábitos'] as const

export function readingTime(markdown: string) {
  const words = markdown.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').match(/[\p{L}\p{N}]+/gu)
  return Math.max(1, Math.ceil((words?.length ?? 0) / 200))
}

export function matchesCategory(category: string, selected: string) {
  return selected === '' || category === selected
}
