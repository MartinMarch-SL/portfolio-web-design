import { areas, type Area } from '../data/properties'

export const maxLtv = .8

export function mortgage(price: number, deposit: number, years: number, annualRate: number) {
  if (![price, deposit, years, annualRate].every(Number.isFinite) || price <= 0 || years <= 0 || annualRate < 0) return 0
  const principal = Math.min(price * maxLtv, Math.max(0, price - deposit))
  const months = years * 12
  const rate = annualRate / 1200
  return rate === 0 ? principal / months : principal * rate / -Math.expm1(-months * Math.log1p(rate))
}

export const conditions = { reformar: .84, bueno: 1, reformado: 1.13 } as const
export const valuationExtras = { terraza: 1.05, piscina: 1.08, mar: 1.12, garaje: 1.04 } as const

export function valuation(area: Area, size: number, condition: keyof typeof conditions, extras: (keyof typeof valuationExtras)[]) {
  const rate = areas.find(item => item.id === area)?.rate ?? 0
  const estimate = rate * Math.max(0, size) * conditions[condition] *
    [...new Set(extras)].reduce((factor, extra) => factor * valuationExtras[extra], 1)
  return { min: Math.round(estimate * .93), max: Math.round(estimate * 1.07) }
}
