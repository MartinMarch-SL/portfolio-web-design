export const sections = ['Para picar', 'Raciones', 'Bocadillos', 'Postres caseros', 'Bebidas'] as const
export const allergens = ['Gluten', 'Huevo', 'Leche', 'Pescado', 'Moluscos', 'Sulfitos'] as const
type Dish = {
  id: string
  name: string
  price: number
  section: typeof sections[number]
  allergens: readonly typeof allergens[number][]
  house?: boolean
  photo?: string
}
export const dishes: readonly Dish[] = [
  { id: 'croquetas', name: 'Croquetas de jamón', price: 750, section: 'Para picar', allergens: ['Gluten', 'Huevo', 'Leche'], house: true, photo: 'tapa-01' },
  { id: 'tortilla', name: 'Pincho de tortilla', price: 420, section: 'Para picar', allergens: ['Huevo'], house: true, photo: 'tapa-02' },
  { id: 'bravas', name: 'Patatas bravas', price: 580, section: 'Para picar', allergens: [], house: true, photo: 'tapa-03' },
  { id: 'boquerones', name: 'Pimientos de Padrón', price: 680, section: 'Para picar', allergens: [], photo: 'tapa-04' },
  { id: 'ensaladilla', name: 'Bombas de la casa', price: 650, section: 'Para picar', allergens: ['Gluten', 'Huevo'], house: true, photo: 'tapa-05' },
  { id: 'calamares', name: 'Calamares a la romana', price: 1100, section: 'Raciones', allergens: ['Gluten', 'Huevo', 'Moluscos'], photo: 'tapa-06' },
  { id: 'pulpo', name: 'Pulpo a la gallega', price: 1450, section: 'Raciones', allergens: ['Moluscos'], photo: 'tapa-07' },
  { id: 'gildas', name: 'Pinchos de la vitrina', price: 320, section: 'Para picar', allergens: ['Gluten', 'Pescado', 'Sulfitos'], photo: 'tapa-08' },
  { id: 'oreja', name: 'Oreja a la plancha', price: 950, section: 'Raciones', allergens: [] },
  { id: 'bocata', name: 'Bocadillo de calamares', price: 620, section: 'Bocadillos', allergens: ['Gluten', 'Huevo', 'Moluscos'] },
  { id: 'pepito', name: 'Pepito de ternera', price: 690, section: 'Bocadillos', allergens: ['Gluten'] },
  { id: 'flan', name: 'Flan de huevo', price: 380, section: 'Postres caseros', allergens: ['Huevo', 'Leche'], house: true },
  { id: 'arroz', name: 'Arroz con leche', price: 400, section: 'Postres caseros', allergens: ['Leche'] },
  { id: 'vermut', name: 'Vermut de grifo', price: 340, section: 'Bebidas', allergens: ['Sulfitos'], house: true },
  { id: 'cana', name: 'Caña', price: 220, section: 'Bebidas', allergens: ['Gluten'] },
]
