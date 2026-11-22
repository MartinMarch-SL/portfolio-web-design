import { layers } from '../data/model'

export function modelLeaders(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('.model-leaders')!
  const leaders = [...svg.querySelectorAll('g')].map(node => ({
    dot: node.querySelector('circle')!,
    lines: node.querySelectorAll('path'),
    text: node.querySelector('text')!,
    node,
  }))
  return (width: number, height: number, lift: (index: number) => number, project: (point: [number, number, number]) => number[]) => {
    if (width < 460) return
    leaders.forEach(({ dot, lines, text, node }, i) => {
      const layer = layers[i + 1]
      const visibility = root.dataset.selected ? Number(root.dataset.selected === layer.id) : lift(i + 1)
      node.style.opacity = String(visibility)
      if (!visibility) return
      const [x, y, z] = layer.parts[0].at
      const [px, py] = project([x, y + layer.lift * lift(i + 1), z])
      const endX = width - 65
      const endY = height * (.78 - i * .145)
      const elbowX = Math.min(endX - 12, Math.max(px + 14, endX - width * .09))
      const dx = elbowX - px
      const dy = endY - py
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      dot.setAttribute('transform', `translate(${px} ${py})`)
      lines[0].setAttribute('transform', `translate(${px} ${py}) rotate(${angle}) scale(${Math.hypot(dx, dy) * visibility} 1)`)
      lines[1].setAttribute('transform', `translate(${px + dx * visibility} ${py + dy * visibility}) scale(${(endX - elbowX) * visibility} 1)`)
      text.setAttribute('transform', `translate(${endX + 6} ${endY})`)
    })
  }
}
