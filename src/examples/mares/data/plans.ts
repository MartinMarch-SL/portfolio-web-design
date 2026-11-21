export interface Room {
  name: string
  area: number
  orientation: number
  photo?: 'a' | 'b' | 'c'
  shape: [x: number, y: number, width: number, height: number] | string
  label: [x: number, y: number]
}

function rect(name: string, area: number, orientation: number, x: number, y: number, w: number, h: number, photo?: Room['photo']): Room {
  return { name, area, orientation, shape: [x, y, w, h], label: [x + w / 2, y + h / 2], photo }
}

interface Plan { level: string; viewBox: string; rooms: Room[]; doors: [number, number, number][] }
const plan = (level: string, rooms: Room[], doors: Plan['doors']): Plan => ({ level, viewBox: '0 0 440 330', rooms, doors })

// Schematic layouts of the floor shown in each dossier, with north at the top.
export const plans: Record<string, Plan> = {
  'patio-de-sant-jaume': plan('Planta primera', [
    rect('Dormitorio 01', 20, 270, 45, 42, 142, 100),
    rect('Dormitorio 02', 16, 270, 45, 142, 142, 126),
    rect('Salón', 29, 90, 228, 42, 166, 135, 'a'),
    rect('Cocina', 17, 90, 228, 177, 166, 91),
    rect('Baños', 12, 180, 187, 203, 41, 65),
    rect('Paso', 8, 0, 187, 42, 41, 161, 'b'),
  ], [[187, 90, 90], [187, 158, 90], [228, 100, 90], [228, 180, 90], [195, 203, 0]]),
  'atico-del-molinar': plan('Planta tercera', [
    rect('Dormitorio 01', 22, 0, 43, 45, 121, 94, 'c'),
    rect('Dormitorio 02', 15, 0, 164, 45, 108, 94),
    rect('Dormitorio 03', 13, 0, 272, 45, 120, 94),
    rect('Paso', 11, 90, 43, 139, 349, 34),
    rect('Salón', 39, 180, 43, 173, 225, 85),
    rect('Cocina', 19, 180, 268, 173, 124, 85, 'b'),
    rect('Terraza', 23, 180, 43, 258, 349, 42, 'a'),
  ], [[90, 139, 0], [200, 139, 0], [312, 139, 0], [130, 173, 0], [318, 173, 0], [150, 258, 0]]),
  'casa-de-los-almendros': plan('Planta baja', [
    rect('Dormitorio', 17, 0, 66, 38, 146, 95, 'c'),
    rect('Baño', 7, 0, 212, 38, 65, 95),
    rect('Cocina', 19, 90, 277, 38, 109, 124, 'b'),
    { name: 'Salón', area: 33, orientation: 270, shape: '66,133 277,133 277,162 386,162 386,252 66,252', label: [191, 198] },
    rect('Porche', 18, 180, 66, 252, 242, 43, 'a'),
  ], [[125, 133, 0], [230, 133, 0], [313, 162, 0], [148, 252, 0]]),
  'casa-del-mercat': plan('Planta segunda', [
    rect('Salón', 21, 90, 238, 61, 142, 112, 'a'),
    rect('Cocina', 15, 180, 238, 173, 142, 88, 'b'),
    rect('Dormitorio 01', 14, 270, 57, 61, 126, 109),
    rect('Dormitorio 02', 11, 270, 57, 170, 126, 91),
    rect('Baño', 6, 180, 183, 201, 55, 60),
    rect('Paso', 7, 0, 183, 61, 55, 140),
  ], [[183, 99, 90], [183, 173, 90], [238, 117, 90], [238, 177, 90], [195, 201, 0]]),
  'galeria-de-son-armadans': plan('Planta cuarta', [
    rect('Galería', 19, 180, 46, 245, 350, 44, 'a'),
    rect('Salón', 25, 180, 46, 142, 161, 103),
    rect('Dormitorio 01', 19, 180, 207, 142, 189, 103),
    rect('Dormitorio 02', 13, 0, 46, 41, 115, 69),
    rect('Dormitorio 03', 13, 0, 161, 41, 112, 69),
    rect('Cocina', 15, 0, 273, 41, 123, 69, 'b'),
    rect('Paso', 8, 270, 46, 110, 350, 32),
  ], [[91, 110, 0], [194, 110, 0], [315, 110, 0], [117, 142, 0], [275, 142, 0], [291, 245, 0]]),
  'villa-de-la-cornisa': plan('Planta de acceso', [
    rect('Garaje', 39, 0, 45, 36, 171, 109),
    rect('Cocina', 31, 90, 216, 36, 175, 109),
    rect('Salón', 58, 180, 45, 145, 208, 109),
    rect('Comedor', 33, 90, 253, 145, 138, 109),
    rect('Terraza', 65, 180, 45, 254, 346, 47, 'b'),
  ], [[161, 145, 0], [305, 145, 0], [253, 184, 90], [112, 254, 0], [317, 254, 0]]),
  'finca-del-olivar': plan('Planta baja', [
    rect('Biblioteca', 20, 270, 62, 47, 135, 111),
    rect('Cocina', 28, 90, 197, 47, 184, 111),
    rect('Salón', 37, 270, 62, 158, 169, 125),
    rect('Patio', 34, 180, 231, 158, 150, 125, 'b'),
  ], [[109, 158, 0], [288, 158, 0], [231, 207, 90]]),
  'mirador-de-bendinat': plan('Planta baja', [
    rect('Dormitorio', 23, 0, 45, 43, 153, 105, 'c'),
    rect('Baño', 10, 0, 198, 43, 68, 105),
    rect('Cocina', 27, 90, 266, 43, 125, 105, 'b'),
    rect('Salón', 42, 180, 45, 148, 213, 103),
    rect('Comedor', 24, 90, 258, 148, 133, 103),
    rect('Porche', 35, 180, 45, 251, 346, 46, 'a'),
  ], [[120, 148, 0], [219, 148, 0], [315, 148, 0], [258, 185, 90], [120, 251, 0], [309, 251, 0]]),
}
