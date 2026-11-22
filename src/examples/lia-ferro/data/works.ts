import { responsiveImage } from '../../../lib/responsive-image'
import type { Style } from './flash'

const captions: [string, Style][] = [
  ['Inscripción en el antebrazo', 'Fine line'],
  ['Motivos pequeños en manos y muñecas', 'Fine line'],
  ['Rama florida en el muslo', 'Fine line'],
  ['Trazo vertical en la espalda', 'Fine line'],
  ['Motivos pequeños en el lateral del cuello', 'Fine line'],
  ['Composición en espalda y brazos', 'Blackwork'],
  ['Trazos curvos en el antebrazo', 'Blackwork'],
  ['Ojo en el dorso de la mano', 'Blackwork'],
  ['Mandala en la espalda alta', 'Ornamental'],
  ['Composición floral en el brazo', 'Ornamental'],
  ['Corona en la parte alta del brazo', 'Ornamental'],
  ['Motivo decorativo en el dorso de la mano', 'Ornamental'],
]

export const works = captions.map(([name, style], index) => ({
  name,
  style,
  photo: responsiveImage(
    `examples/lia-ferro/img/trabajo-${String(index + 1).padStart(2, '0')}.webp`,
    '(max-width: 760px) 50vw, 33vw',
    1120,
  ),
}))
