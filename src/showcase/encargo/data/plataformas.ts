export type Tipo = 1 | 2 | 3 | 4

interface Plataforma {
  tipo: Tipo
  nombre: string
  descripcion: string
  capa: string
  incluye: string
  noIncluye: string
  plazo: string
  datos: string
  ejemplos: [string, string][]
  horasMin?: number
  horasMax?: number
}

export const plataformas: Plataforma[] = [
  {
    tipo: 1, nombre: 'Escaparate', capa: 'Diseño',
    descripcion: 'Una web para presentar tu negocio. El estudio actualiza los textos y las fotos cuando lo pidas.',
    incluye: 'Diseño y contenido en una web estática.', noIncluye: 'Panel de administración ni lógica de negocio.',
    plazo: '2 a 4 semanas', datos: 'Tu negocio, tus gustos, las páginas y su contenido.',
    ejemplos: [['RUIDO', 'ruido/'], ['Marès', 'mares/'], ['Bar Caribe', 'bar-caribe/']],
  },
  {
    tipo: 2, nombre: 'Autogestionable', capa: 'Panel de administración',
    descripcion: 'Edita tus textos, fotos y obras desde un panel dentro de tu web, sin tocar código.',
    incluye: 'Diseño, contenido y acceso de administración.', noIncluye: 'Reservas, pagos ni áreas de socios.',
    plazo: '4 a 6 semanas', datos: 'Qué quieres editar y quién administrará la web.',
    ejemplos: [['Simón Lera', 'simon-lera/'], ['Inés Arranz', 'ines-arranz/']],
  },
  {
    tipo: 3, nombre: 'Con funcionalidades', capa: 'Backend y lógica',
    descripcion: 'Gestiona contenido y datos de reservas, inscripciones, pagos o áreas de socios.',
    incluye: 'Panel de administración y lógica de negocio.', noIncluye: 'Marketplace ni gestión avanzada de roles.',
    plazo: '6 a 10 semanas', datos: 'Qué acciones deben funcionar y cómo se gestionan.',
    ejemplos: [['Las Moreras', 'las-moreras/'], ['Los Almendros', 'los-almendros/'], ['Pinar Alto', 'pinar-alto/'], ['Lía Ferro', 'lia-ferro/']],
  },
  {
    tipo: 4, nombre: 'Plataforma', capa: 'Usuarios y roles',
    descripcion: 'Un producto a medida para tu equipo y sus usuarios, como un marketplace o un servicio en línea.',
    incluye: 'Usuarios, permisos, integraciones y panel de gestión.', noIncluye: 'Operación diaria del producto.',
    plazo: '10 a 16 semanas', datos: 'Roles, permisos, vendedores, comisiones e integraciones.',
    ejemplos: [],
  },
]
