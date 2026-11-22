export const photos = {
  'techo-instalado': [1600, 900, 'Bandejas portacables y tuberías rojas bajo un forjado de hormigón'],
  'tecnico-elevador': [1200, 900, 'Técnico en una plataforma elevadora junto a las instalaciones del techo'],
  bandejas: [1200, 800, 'Bandejas portacables curvas vistas desde abajo'],
  'forjado-tubos': [1200, 800, 'Tuberías tendidas sobre un forjado en obra'],
  'bandeja-pci': [1200, 800, 'Bandeja portacables junto a la red de rociadores'],
  'operario-andamio': [1200, 900, 'Operario sobre un andamio bajo un techo de hormigón'],
  'conductos-oscuro': [1200, 800, 'Conductos y difusor de aire en un techo oscuro'],
  'conductos-blanco': [1200, 800, 'Conductos blancos de ventilación suspendidos del techo'],
  'conducto-nave': [1200, 800, 'Conducto helicoidal entre vigas de acero azul'],
  'fv-nave': [1440, 960, 'Vista aérea de paneles solares en la cubierta de una nave'],
  'fv-patron': [1200, 800, 'Filas de módulos fotovoltaicos vistas desde el aire'],
  'sala-cuadros': [1200, 800, 'Sala técnica con armarios de distribución eléctrica'],
  cuadro: [1200, 800, 'Detalle del cableado interior de un cuadro eléctrico'],
  plano: [1200, 800, 'Lápiz sobre un plano técnico'],
  'revision-plano': [1200, 800, 'Dos personas revisan un plano de proyecto'],
  ferralla: [1200, 800, 'Vista cenital de un operario sobre una malla de armaduras'],
} as const

export type PhotoName = keyof typeof photos
