import { changeQuantity, deserialize, dishById, serialize, storageKey, total } from '../lib/comanda'
import { price } from '../lib/service'

let lines: ReturnType<typeof deserialize> = []
try { lines = deserialize(localStorage.getItem(storageKey)) } catch { /* La comanda sigue en memoria. */ }

const filters = document.querySelector<HTMLFormElement>('[data-filters]')!
const rows = [...document.querySelectorAll<HTMLElement>('[data-dish]')]
const order = document.querySelector<HTMLElement>('[data-order]')!
const list = order.querySelector<HTMLUListElement>('[data-order-lines]')!
const empty = order.querySelector<HTMLElement>('[data-order-empty]')!
const pay = order.querySelector<HTMLButtonElement>('[data-pay]')!
const toggle = order.querySelector<HTMLButtonElement>('[data-order-toggle]')!
const close = order.querySelector<HTMLButtonElement>('[data-order-close]')!
const status = document.querySelector<HTMLElement>('[data-order-status]')!
const mobile = matchMedia('(max-width: 860px)')

function filter() {
  const form = new FormData(filters)
  rows.forEach(row => {
    const dish = dishById.get(row.dataset.dish!)!
    row.hidden = dish.allergens.some(allergen => allergen === form.get('allergen')) ||
      (form.has('house') && !dish.house)
  })
  document.querySelectorAll<HTMLElement>('.menu-section').forEach(section => {
    section.hidden = !section.querySelector('[data-dish]:not([hidden])')
  })
  document.querySelector<HTMLElement>('[data-empty]')!.hidden = rows.some(row => !row.hidden)
}

function render() {
  const sum = price(total(lines))
  order.querySelector('[data-order-total]')!.textContent = sum
  order.querySelector('[data-order-summary]')!.textContent = sum
  empty.hidden = lines.length > 0
  pay.disabled = !lines.length
  list.replaceChildren(...lines.map(({ id, quantity }) => {
    const item = document.createElement('li')
    const name = document.createElement('span')
    const minus = document.createElement('button')
    const plus = document.createElement('button')
    const dish = dishById.get(id)!
    name.textContent = `${quantity} × ${dish.name}`
    for (const [button, delta, label, glyph] of [[minus, -1, 'Quitar', '−'], [plus, 1, 'Añadir', '+']] as const) {
      button.type = 'button'
      button.textContent = glyph
      button.dataset.quantity = String(delta)
      button.dataset.id = id
      button.setAttribute('aria-label', `${label} ${dish.name} de la comanda`)
    }
    item.append(name, minus, plus)
    return item
  }))
}

function save() {
  try { localStorage.setItem(storageKey, serialize(lines)) } catch { /* La comanda sigue en memoria. */ }
  render()
}

function setDrawer(open: boolean) {
  order.toggleAttribute('data-open', open)
  toggle.setAttribute('aria-expanded', String(open))
}
toggle.addEventListener('click', () => {
  const open = !order.hasAttribute('data-open')
  setDrawer(open)
  if (open) close.focus()
})
function closeDrawer() {
  setDrawer(false)
  toggle.focus()
}
close.addEventListener('click', closeDrawer)
order.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && order.hasAttribute('data-open')) closeDrawer()
})
mobile.addEventListener('change', () => setDrawer(false))
filters.addEventListener('change', filter)
filters.hidden = false
order.hidden = false
rows.forEach(row => {
  const button = row.querySelector<HTMLButtonElement>('[data-add]')!
  button.hidden = false
  button.addEventListener('click', () => {
    const id = button.dataset.add!
    lines = changeQuantity(lines, id, 1)
    empty.textContent = 'De momento, nada en la mesa.'
    status.textContent = `${dishById.get(id)!.name}. Total: ${price(total(lines))}.`
    save()
  })
})
list.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-quantity]')
  if (!button) return
  const id = button.dataset.id!
  const delta = button.dataset.quantity === '1' ? 1 : -1
  lines = changeQuantity(lines, id, delta)
  save()
  const replacement = [...list.querySelectorAll<HTMLButtonElement>('[data-quantity]')].find(
    control => control.dataset.id === id && control.dataset.quantity === String(delta),
  )
  const fallback = mobile.matches ? close : rows.find(row => row.dataset.dish === id && !row.hidden)?.querySelector('button')
  ;(replacement ?? list.querySelector('button') ?? fallback ?? filters.querySelector('select'))?.focus()
})
pay.addEventListener('click', () => {
  lines = []
  save()
  empty.textContent = 'La cuenta está saldada. El palillo invita la casa.'
  status.textContent = empty.textContent
  if (mobile.matches) close.focus()
  else filters.querySelector('select')?.focus()
})
filter()
render()
