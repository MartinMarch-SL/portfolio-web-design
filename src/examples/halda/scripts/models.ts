import { Geometry, Mesh, Transform, type OGLRenderingContext, type Program } from 'ogl'
import type { Scene } from '../data/cases'
import { extrude, lathe, roundedBox, samplePoints, type XYZ } from './geometry'
import { ink, materials, scanMaterial, shadowMaterial } from './materials'

export interface Mark {
  label: string
  point: () => XYZ
  bounds?: XYZ
  defect?: boolean
  neutral?: boolean
  visible?: () => boolean
  leader?: () => XYZ
}

export function makeModel(gl: OGLRenderingContext, id: Scene, dpr: number) {
  const root = new Transform()
  const marks: Mark[] = []
  const updates: ((time: number) => void)[] = []
  const m = materials(gl, id === 'hero')
  const signal = ink(gl, [.25,.88,.71], .8)
  const faint = ink(gl, [.25,.88,.71], .095)
  const cloud = ink(gl, [.52,.72,.72], .78, (id === 'hero' ? 1.22 : 1.65) * dpr)
  const gridInk = ink(gl, [.23,.27,.29], .38)
  const programs = new Set<Program>([...Object.values(m), signal, faint, cloud, gridInk])
  const geometries = new Set<Geometry>()
  const shapes = new Map<string, Geometry>()
  function at(geometry: Geometry, program: Program, point: XYZ, parent = root, mode = gl.TRIANGLES as number) {
    geometries.add(geometry)
    programs.add(program)
    const mesh = new Mesh(gl, { geometry, program, mode })
    mesh.position.set(...point)
    mesh.setParent(parent)
    return mesh
  }
  function box(size: XYZ, point: XYZ, material = m.anodized, bevel = .045, parent = root) {
    const key = [...size, bevel].join('/')
    let geometry = shapes.get(key)
    if (!geometry) {
      geometry = roundedBox(gl, size, bevel)
      shapes.set(key, geometry)
    }
    return at(geometry, material, point, parent)
  }
  function turning(profile: [number, number][], point: XYZ, material: Program, parent = root, slices = 48) {
    const key = 'lathe/' + slices + '/' + profile.flat().join('/')
    let geometry = shapes.get(key)
    if (!geometry) {
      geometry = lathe(gl, profile, slices)
      shapes.set(key, geometry)
    }
    return at(geometry, material, point, parent)
  }
  function cylinder(r: number, h: number, point: XYZ, material: Program, parent = root, slices = 48) {
    const f = Math.min(.03, h / 4, r / 8)
    return turning([[0,h/2],[r-f,h/2],[r,h/2-f],[r,-h/2+f],[r-f,-h/2],[0,-h/2]], point, material, parent, slices)
  }
  function ring(r: number, inside: number, h: number, point: XYZ, material: Program, parent = root) {
    const f = Math.min(.035,h/4,(r-inside)/4)
    return turning([[inside,h/2-f],[inside+f,h/2],[r-f,h/2],[r,h/2-f],[r,-h/2+f],[r-f,-h/2],[inside+f,-h/2],[inside,-h/2+f],[inside,h/2-f]], point, material, parent)
  }
  function group(point: XYZ, parent = root) {
    const object = new Transform()
    object.position.set(...point)
    object.setParent(parent)
    return object
  }
  function lines(points: XYZ[], material = signal, mode = gl.LINE_STRIP as number) {
    return at(new Geometry(gl, { position: { size: 3, data: new Float32Array(points.flat()) } }), material, [0,0,0], root, mode)
  }
  function patch(width: number, depth: number, point: XYZ, material: Program) {
    const square = new Geometry(gl, {
      position: { size: 3, data: new Float32Array([-.5,0,-.5, -.5,0,.5, .5,0,.5, -.5,0,-.5, .5,0,.5, .5,0,-.5]) },
    })
    const plane = at(square, material, point)
    plane.scale.set(width, 1, depth)
    return plane
  }
  function stage(width: number, depth: number, y: number) {
    patch(width * 1.6,depth * 1.85,[0,y,0],shadowMaterial(gl,[.115,.136,.155]))
    patch(width * 1.15,depth * 1.25,[0,y+.007,0],shadowMaterial(gl,[.002,.003,.004]))
    const grid: XYZ[] = []
    for (let x = -width/2; x <= width/2; x += .48) grid.push([x,y+.015,-depth/2], [x,y+.015,depth/2])
    for (let z = -depth/2; z <= depth/2; z += .48) grid.push([-width/2,y+.015,z], [width/2,y+.015,z])
    lines(grid, gridInk, gl.LINES)
  }
  function part(parent: Transform, point: XYZ = [0,0,0], scale = 1) {
    const piece = group(point, parent)
    piece.scale.set(scale)
    const outline: [number,number][] = [[-.65,-.53],[-.88,-.28],[-.88,.31],[-.64,.52],[.62,.52],[.9,.26],[.9,-.30],[.68,-.53]]
    let geometry = shapes.get('part')
    if (!geometry) {
      geometry = extrude(gl, outline, .22)
      shapes.set('part', geometry)
    }
    const base = at(geometry, m.aluminum, [0,0,0], piece)
    box([1.4,.1,.95],[0,.124,0],m.bright,.047,piece)
    ring(.405,.235,.16,[0,.21,0],m.aluminum,piece)
    ring(.34,.216,.046,[0,.307,0],m.bright,piece)
    cylinder(.22,.028,[0,.18,0],m.dark,piece)
    for (const x of [-.63,.65]) for (const z of [-.27,.27]) {
      ring(.092,.053,.032,[x,.142,z],m.bright,piece)
      cylinder(.053,.018,[x,.14,z],m.dark,piece)
    }
    return { piece, base }
  }
  function camera(point: XYZ) {
    const rig = group(point)
    box([1.2,.78,1.14],[0,.24,0],m.anodized,.1,rig)
    box([1.22,.09,1.17],[0,-.15,0],m.aluminum,.035,rig)
    box([.74,.1,.9],[0,.66,0],m.dark,.07,rig)
    for (let i = 0; i < 8; i++) box([.045,.105,.78],[(i - 3.5)*.122,.72,0],m.anodized,.014,rig)
    for (const x of [-.43,.43]) for (const z of [-.42,.42]) cylinder(.047,.04,[x,-.21,z],m.bright,rig,12)
    cylinder(.41,.22,[0,-.29,0],m.anodized,rig)
    ring(.418,.32,.10,[0,-.43,0],m.bright,rig)
    ring(.38,.28,.25,[0,-.54,0],m.dark,rig)
    for (let i = 0; i < 28; i++) {
      const angle = i * Math.PI / 14
      const rib = box([.024,.155,.034],[Math.cos(angle)*.376,-.53,Math.sin(angle)*.376],m.anodized,.008,rig)
      rib.rotation.y = -angle
    }
    ring(.36,.27,.12,[0,-.70,0],m.aluminum,rig)
    turning([[0,-.73],[.275,-.73],[.275,-.76],[.22,-.79],[.13,-.812],[0,-.821]], [0,0,0], m.glass,rig)
    ring(.67,.39,.13,[0,-.69,0],m.anodized,rig)
    ring(.61,.43,.027,[0,-.766,0],m.bright,rig)
    ring(.636,.613,.016,[0,-.754,0],m.white,rig)
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12
      cylinder(.025,.02,[Math.cos(angle)*.518,-.792,Math.sin(angle)*.518],m.white,rig,10)
    }
    const connector = group([.62,.35,.24],rig)
    connector.rotation.z = -Math.PI / 2
    cylinder(.148,.16,[0,.04,0],m.bright,connector,20)
    ring(.16,.099,.075,[0,.15,0],m.copper,connector)
    cylinder(.085,.21,[0,.24,0],m.rubber,connector,20)
    for (let i = 0; i < 5; i++) ring(.102,.082,.019,[0,.16+i*.033,0],m.anodized,connector)
    for (let i = 0; i < 6; i++) box([.32,.033,.05],[-.30,.09+i*.080,.583],m.anodized,.01,rig)
    box([.43,.12,.055],[.03,.35,.586],m.dark,.012,rig)
    box([.25,.013,.017],[0,.36,.62],m.bright,.005,rig)
    box([.035,.034,.015],[.17,.35,.62],m.white,.006,rig)
  }

  if (id === 'hero') {
    stage(9.5,5.4,-.96)
    patch(8.8,3.1,[-.9,-.937,.19],shadowMaterial(gl,[.002,.003,.004]))
    patch(1.8,1.55,[-.92,-.148,.16],shadowMaterial(gl,[.22,.44,.35],true))
    box([1.36,.16,1.35],[-.92,-.68,-1.23],m.anodized)
    box([.24,3.45,.28],[-.92,1,-1.25],m.aluminum,.035)
    box([.3,.27,1.65],[-.92,2.65,-.55],m.anodized,.06)
    box([.72,.21,.75],[-.92,2.72,.06],m.anodized,.049)
    for (const x of [-1.19,-.65]) {
      box([.075,.53,.66],[x,2.54,-.20],m.anodized,.03)
      cylinder(.054,.052,[x,2.85,.11],m.bright,root,12)
    }
    camera([-.92,2.24,.1])
    box([6.6,.36,1.68],[-1.08,-.43,.16],m.anodized,.085)
    box([6.48,.13,1.55],[-1.08,-.22,.16],m.rubber,.07)
    for (const x of [-3.92,1.67]) for (const z of [-.47,.82]) box([.22,.54,.21],[x,-.66,z],m.aluminum,.025)
    for (const z of [-.7,1.01]) {
      box([6.55,.15,.12],[-1.08,-.23,z],m.aluminum,.025)
      for (let i = 0; i < 11; i++) {
        const screw = cylinder(.035,.027,[-4.08+i*.59,-.232,z + .064],m.bright,root,12)
        screw.rotation.x = Math.PI / 2
      }
    }
    for (const x of [-4.31,2.16]) {
      cylinder(.168,1.64,[x,-.32,.16],m.rubber).rotation.x = Math.PI / 2
      for (const z of [-.68,1.04]) cylinder(.114,.11,[x,-.33,z],m.bright,root,24).rotation.x = Math.PI / 2
    }
    const tread: XYZ[] = []
    for (let i = 0; i < 62; i++) {
      const x = -4.19+i*.103
      tread.push([x,-.153,-.58], [x+.095,-.153,.89])
    }
    lines(tread, ink(gl,[.24,.26,.29],.39), gl.LINES)
    for (const x of [-3.25,-.92,1.51]) part(root,[x,-.046,.14],.77)
    const moving = root.children.slice(-3)
    const partShadow = shadowMaterial(gl,[.003,.005,.006])
    const shadows = moving.map(() => patch(1.94,1.33,[0,-.152,.14],partShadow))
    const twinOrigin: XYZ = [2.70,-.13,.36]
    const twin = group(twinOrigin)
    at(samplePoints(gl,shapes.get('part')!,4600,43),cloud,[0,0,0],twin,gl.POINTS)
    const twinRing = lathe(gl,[[.22,.12],[.39,.12],[.4,.09],[.4,-.12],[.22,-.12],[.22,.12]])
    at(samplePoints(gl,twinRing,2100,11),cloud,[0,.17,0],twin,gl.POINTS)
    twinRing.remove()
    patch(2.6,2.1,[2.70,-.35,.36],shadowMaterial(gl,[.05,.15,.14],true))
    const scan = patch(1.27,1.27,[-.92,.49,.12],scanMaterial(gl))
    scan.rotation.set(-Math.PI/2,-Math.PI/2,0)
    const defect = box([.22,.008,.016],[.43,.165,.31],m.defect,.003,moving[1])
    defect.rotation.y = -.37
    let flagged = true
    marks.push(
      { label:'Óptica · 35 mm', point:() => [-1.22,1.94,.55], neutral:true },
      { label:'Gemelo 3D', point:() => [2.57,-.24,.82], leader:() => twinOrigin },
      { label:'DEF-03 · rayado · 0,97', point:() => [2.73,-.01,.36], bounds:[.67,.4,.58], defect:true,
        visible:() => flagged },
    )
    updates.push(time => {
      const offset = time * .38
      moving.forEach((item, i) => {
        item.position.x = -3.65 + (i * 2.15 + offset + .58) % 6.45
        shadows[i].position.x = item.position.x
      })
      const phase = (time * .38 + .1) % 2.15
      scan.position.x = -.92 + Math.min(.67, (phase - .35) * .85)
      scan.visible = phase < 1.14
      flagged = Math.floor((time * .38 + .1) / 2.15) % 3 === 0
      twin.rotation.y = .07 * Math.sin(time)

    })
  }

  if (id === 'surface' || id === 'laser') {
    stage(6.9,5.2,-.53)
    box([5.6,.24,3.75],[0,-.31,0],m.dark,.12)
    const work = part(root,[0,-.05,0],2.8)
    work.piece.rotation.y = -.14
    if (id === 'surface') {
      patch(1.8,.83,[1.0,.451,.49],shadowMaterial(gl,[.94,.25,.08],true))
      patch(1.16,.44,[1.04,.455,.49],shadowMaterial(gl,[.98,.48,.12],true))
      lines([[.58,.46,.69],[.87,.46,.55],[.94,.46,.57],[1.37,.46,.35]],ink(gl,[1,.36,.24],.93))
      marks.push({ label:'DEF-03 · rayado · 0,97', point:() => [1.02,.48,.52], bounds:[.97,.15,.42], defect:true })
    } else {
      const trace: XYZ[] = [[-2.55,.092,.24],[-1.73,.11,.24],[-1.7,.45,.24],[-1.13,.45,.24],[-1.08,.87,.24],[-.67,.87,.24],[-.62,.48,.24],[.62,.48,.24],[.68,.87,.24],[1.08,.87,.24],[1.13,.45,.24],[1.65,.45,.24],[1.73,.092,.24],[2.54,.092,.24]]
      lines(trace)
      lines([[1.95,.1,1.23],[2.26,.1,1.23],[2.26,.87,1.23],[1.95,.87,1.23]])
      box([4.8,1.05,.017],[0,.62,.24],faint,.004)
      marks.push({ label:'24,80 ±0,10 mm', point:() => [2.13,.99,1.15] },{ label:'Perfil Z · 35 µm', point:() => [-2,.19,.24] })
    }
  }

  function board(point: XYZ, parent = root) {
    const size: [number,number][] = [[-2.25,-1.47],[-2.42,-1.25],[-2.42,1.21],[-2.24,1.43],[2.18,1.43],[2.4,1.2],[2.4,-1.25],[2.15,-1.47]]
    at(extrude(gl,size,.13),m.pcb,point,parent)
    for (const x of [-2.17,2.11]) for (const z of [-1.18,1.16]) {
      ring(.11,.052,.03,[point[0]+x,point[1]+.07,point[2]+z],m.gold,parent)
      cylinder(.055,.024,[point[0]+x,point[1]+.08,point[2]+z],m.dark,parent)
    }
    for (let i = 0; i < 13; i++) {
      const x = point[0]-1.97+i*.127
      box([.042,.008,1.65],[x,point[1]+.069,point[2]+.03],m.gold,.003,parent)
      box([.085,.045,.14],[x,point[1]+.085,point[2]+.94],m.bright,.011,parent)
      box([.08,.07,.13],[x,point[1]+.103,point[2]-.94],m.anodized,.009,parent)
    }
    box([1.23,.15,1.01],[point[0]-.38,point[1]+.156,point[2]-.03],m.dark,.06,parent)
    for (let i = 0; i < 12; i++) {
      for (const z of [-.6,.54]) box([.043,.045,.17],[point[0]-.94+i*.102,point[1]+.108,point[2]+z],m.bright,.008,parent)
    }
    for (let i = 0; i < 7; i++) {
      const z = point[2]-.98+i*.31
      box([1.12,.008,.037],[point[0]+1.18,point[1]+.069,z],m.gold,.005,parent)
      box([.29,.16,.20],[point[0]+.77,point[1]+.14,z],m.anodized,.018,parent)
      cylinder(.105,.27,[point[0]+1.52,point[1]+.20,z],m.aluminum,parent,20)
    }
    box([.56,.3,1.86],[point[0]+1.94,point[1]+.17,point[2]],m.anodized,.038,parent)
    return parent
  }

  if (id === 'pcb') {
    stage(6.8,4.4,-.41)
    board([0,-.02,0])
    box([.062,.033,.11],[.08,.092,.64],m.defect,.012)
    marks.push({ label:'J14 · soldadura fría · 0,98', point:() => [.08,.22,.64], bounds:[.31,.19,.28], defect:true },
      { label:'AOI · 12 µm/px', point:() => [-1.72,.22,-.76] })
  }

  if (id === 'bin') {
    stage(6.7,5,-.68)
    box([5.03,.19,3.62],[0,-.48,0],m.anodized,.10)
    for (const x of [-2.45,2.45]) box([.13,.59,3.58],[x,-.14,0],m.aluminum,.055)
    for (const z of [-1.75,1.75]) box([5,.23,.14],[0,-.33,z],m.anodized,.046)
    const pellet = roundedBox(gl,[.91,.39,.54],.135)
    for (const [i, position] of [[-1.55,-.13,-.87],[-.27,-.08,-.93],[1.18,-.07,-.9],[-1.42,-.07,.30],[-.10,.02,.31],[1.27,-.06,.50],[.38,-.12,1.11]].entries()) {
      const point = at(samplePoints(gl,pellet,500,i + 9),cloud,position as XYZ,root,gl.POINTS)
      point.rotation.set(i*.48,i*.81,i*.52)
    }
    pellet.remove()
    const target: XYZ = [-.12,.28,.32]
    const axes: XYZ[] = [[.88,.28,.32],[-.12,1.32,.32],[-.12,.28,1.46]]
    axes.forEach((end, i) => {
      lines([target,end],ink(gl,[[.81,.45,.34],[.36,.76,.63],[.59,.68,.86]][i],.9))
      marks.push({ label:['X','Y','Z'][i], point:() => end, neutral:true })
    })
    const path: XYZ[] = []
    for (let i = 0; i <= 20; i++) { const n = i/20; path.push([2.07*(1-n)-.12,.54+1.27*(1-n*n),-.65+.97*n]) }
    lines(path)
    const gripper = group([1.95,1.86,-.65])
    box([.85,.2,.44],[0,0,0],m.anodized,.055,gripper)
    for (const x of [-.31,.31]) box([.14,.47,.21],[x,-.22,.02],m.bright,.035,gripper)
    marks.push({ label:'Pose 6D · 0,96', point:() => [-.3,.71,.30], bounds:[1,.48,.64] })
  }

  if (id === 'dpm') {
    stage(6.8,4.8,-.64)
    box([4.76,.47,2.99],[0,-.23,0],m.aluminum,.17)
    box([4.35,.11,2.56],[0,.041,0],m.bright,.085)
    for (const x of [-1.9,1.9]) for (const z of [-.96,.96]) {
      ring(.19,.115,.056,[x,.11,z],m.aluminum)
      cylinder(.116,.027,[x,.12,z],m.dark)
    }
    const pattern = [
      '101010101010','110010110011','101101010010','100110011001','111011101010','101101101011',
      '101001000000','110111011001','100010010110','110111110011','101101011100','111111111111',
    ]
    for (let row = 0; row < pattern.length; row++) for (let col = 0; col < pattern[row].length; col++) {
      if (pattern[row][col] === '1') cylinder(.042,.012,[(col-5.5)*.113,.101,(row-5.5)*.113],m.dark,root,10)
    }
    lines([[-.76,.118,-.76],[.76,.118,-.76],[.76,.118,.76],[-.76,.118,.76],[-.76,.118,-.76]],signal)
    marks.push({ label:'DPM · ECC 200 · lectura válida', point:() => [-.66,.68,-.68], leader:() => [-.76,.12,-.76] })
  }

  if (id === 'edge') {
    stage(7,4.9,-1.96)
    const layers = [
      group([0,0,0]),group([0,0,0]),group([0,0,0]),group([0,0,0]),group([0,0,0]),group([0,0,0]),
    ]
    box([3.49,.30,2.24],[0,0,0],m.anodized,.12,layers[0])
    box([2.92,.12,1.94],[0,.16,0],m.dark,.06,layers[0])
    for (let i = 0; i < 7; i++) box([.12,.1,1.52],[(i-3)*.33,.2,0],m.anodized,.016,layers[0])
    const circuit = group([0,0,0],layers[1])
    circuit.scale.set(.66)
    board([0,0,0],circuit)
    box([2.27,.11,1.51],[0,0,0],m.pcb,.045,layers[2])
    box([.93,.14,.76],[0,.10,0],m.dark,.05,layers[2])
    for (let i = 0; i < 12; i++) for (const z of [-.64,.64]) box([.076,.026,.14],[(i-5.5)*.16,.06,z],m.gold,.008,layers[2])
    box([1.38,.12,1.14],[0,0,0],m.anodized,.035,layers[3])
    box([.74,.07,.52],[0,.09,0],m.glass,.036,layers[3])
    for (let i = 0; i < 8; i++) box([.052,.038,.13],[(i-3.5)*.129,.074,.43],m.gold,.008,layers[3])
    ring(.49,.32,.33,[0,0,0],m.anodized,layers[4])
    ring(.47,.31,.08,[0,.19,0],m.bright,layers[4])
    turning([[0,.24],[.18,.239],[.26,.219],[.31,.175],[.31,.13],[0,.13]],[0,0,0],m.glass,layers[4])
    box([3.49,.115,2.23],[0,0,0],m.aluminum,.055,layers[5])
    for (let i = 0; i < 14; i++) box([.075,.29,1.83],[(i-6.5)*.229,.135,0],m.anodized,.018,layers[5])
    const axes: XYZ[] = [[-1.32,-1.53,.94],[-.62,-.89,1.13],[.07,-.24,.84],[.64,.40,.62],[.98,1.16,.41],[1.70,1.80,.08]]
    const names = ['Tapa CNC','Placa portadora','Módulo de cómputo','Sensor CMOS','Óptica','Disipador']
    layers.forEach((layer,i) => marks.push({
      label:names[i], point:() => [layer.position.x + (i % 2 ? 1 : -.85),layer.position.y+.14,layer.position.z+.54],
      leader:() => [layer.position.x,layer.position.y+.13,layer.position.z], neutral:true,
    }))
    updates.push(time => {
      const spread = .36 + .64 * (.5 + .5*Math.cos(time * .72))
      layers.forEach((layer,i) => layer.position.set(axes[i][0]*spread,axes[i][1]*spread,axes[i][2]*spread))
    })
  }

  const view: Record<Scene, { eye: XYZ; target: XYZ }> = {
    hero: { eye:[3.75,3.2,6.3], target:[-.30,.89,0] },
    surface: { eye:[4.8,4.4,6.5], target:[0,.12,0] },
    bin: { eye:[4.5,5,7], target:[0,.35,0] },
    pcb: { eye:[3.4,5.9,6.1], target:[0,.07,0] },
    laser: { eye:[4.1,3.6,6.9], target:[0,.17,0] },
    dpm: { eye:[3.7,5.1,6.7], target:[0,.02,0] },
    edge: { eye:[6.8,4.4,8.4], target:[0,.04,.36] },
  }
  return {
    root, marks, ...view[id],
    update: (time: number) => updates.forEach(update => update(time)),
    release() {
      geometries.forEach(geometry => geometry.remove())
      programs.forEach(program => {
        for (const location of program.uniformLocations.values()) gl.renderer.state.uniformLocations.delete(location)
        program.remove()
      })
    },
  }
}
