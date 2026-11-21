export const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
export const wholeEuros = new Intl.NumberFormat('es-ES', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
})
