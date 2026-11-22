import { certifications, contact, disciplines } from '../data/company'
import { projects } from '../data/projects'
import { number } from '../lib/offer'

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!))

export function documentRows(rows: [string, string][]) {
  return '<dl>' + rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('') + '</dl>'
}

export function downloadDocument(filename: string, title: string, body: string) {
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>${escape(title)}</title>
<style>
body{background:#f2f1ec;color:#15181b;font:16px/1.5 system-ui;max-width:48rem;margin:3rem auto;padding:0 1.4rem}
header,section{border-top:1px solid #15181b;padding:1rem 0 1.5rem}header{border-top:5px solid #c26a3a}
.cover{min-height:45vh;display:flex;flex-direction:column;justify-content:center}
h1{font-size:clamp(2rem,7vw,4rem);letter-spacing:-.06em;line-height:1;margin:.4em 0}
h2{margin:.3rem 0 1rem}dt,small{font-family:monospace}dd{margin:0;overflow-wrap:anywhere}
dl div{display:grid;grid-template-columns:minmax(7rem,1fr) 2fr;gap:1rem;padding:.45rem 0;border-bottom:1px solid #c9ccc9}
li{margin-bottom:.4rem}li,dl div{break-inside:avoid}
@media print{body{background:white;margin:0;padding:0}.cover{min-height:85vh;break-after:page}h2{break-after:avoid}}
</style></head><body>${body}</body></html>`
  const objectUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename + '.html'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export function downloadDossier() {
  const sections = [
    ['Datos de empresa', documentRows([['Actividad', 'Montaje, legalización, puesta en marcha y mantenimiento de instalaciones MEP'], ['Base operativa', 'Zaragoza'], ['Fundación', '2003'], ['Equipo', '85 técnicos propios']])],
    ['Capacidades', '<ul>' + disciplines.map(({ name, scope }) => `<li><strong>${escape(name)}</strong> · ${escape(scope)}</li>`).join('') + '</ul>'],
    ['Certificaciones y homologaciones', '<p>Documentación simulada.</p><ul>' + certifications.map(item => `<li>${escape(item)}</li>`).join('') + '</ul>'],
    ['Obras seleccionadas', documentRows(projects.slice(0, 3).map(project => [project.name, `${project.place} · ${number(project.area)} m² · ${project.power} · ${project.duration} semanas`]))],
    ['Contacto', documentRows([['Oficina de estudios', contact], ['Localización', 'Zaragoza']])],
  ]
  downloadDocument('RAMAL-dossier', 'Dossier de empresa · RAMAL', `<header class="cover"><small>DOSSIER DE EMPRESA / 2026</small><h1>RAMAL<br>Instalaciones Técnicas</h1><p>Instalaciones MEP para ingenierías y constructoras.</p><p>Empresa ficticia · Zaragoza</p></header>` +
    sections.map(([title, content]) => `<section><h2>${title}</h2>${content}</section>`).join(''))
}
