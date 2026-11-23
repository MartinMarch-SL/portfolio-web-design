import { Program, type OGLRenderingContext } from 'ogl'

const vertex = /* glsl */`
  attribute vec3 position;
  attribute vec3 normal;
  uniform mat4 modelMatrix, modelViewMatrix, projectionMatrix;
  varying vec3 p, n, local;
  void main() {
    p = (modelMatrix * vec4(position, 1.)).xyz;
    n = mat3(modelMatrix) * normal;
    local = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`

const fragment = /* glsl */`
  precision highp float;
  uniform vec3 color, cameraPosition;
  uniform float metal, roughness, brush, glass, emission, studio;
  varying vec3 p, n, local;
  vec3 light(vec3 N, vec3 V, vec3 L, vec3 hue, float grain) {
    vec3 H = normalize(L + V);
    float nl = max(dot(N,L),0.);
    float nh = max(dot(N,H),0.);
    float nv = max(dot(N,V),.001);
    float a = max(.085,roughness * roughness + grain);
    float a2 = a*a;
    float d = a2 / (3.14159 * pow(nh*nh*(a2-1.)+1.,2.));
    float k = pow(roughness+1.,2.) / 8.;
    float g = (nl/(nl*(1.-k)+k)) * (nv/(nv*(1.-k)+k));
    vec3 f0 = mix(vec3(.045), color, metal);
    vec3 F = f0 + (1.-f0)*pow(1.-max(dot(V,H),0.),5.);
    return hue * (color * (.74-metal*.49) * nl + d*g*F*nl / max(.025,4.*nl*nv));
  }
  void main() {
    vec3 N = normalize(n);
    vec3 V = normalize(cameraPosition-p);
    float lines = sin(local.z*372.+local.x*7.)*.5+.5;
    float grain = brush * (.115*lines-.055);
    vec3 shade = color * (.085 + .11 * max(N.y,0.));
    shade += light(N,V,normalize(vec3(-.9,1.7,1.)),vec3(2.55,1.83,1.22),grain);
    shade += light(N,V,normalize(vec3(1.2,.65,-1.5)),vec3(.52,1.15,2.10),grain);
    shade += light(N,V,normalize(vec3(.7,.16,1.)),vec3(.30,.35,.41),grain);
    vec3 R = reflect(-V,N);
    float softbox = pow(max(dot(R,normalize(vec3(-.55,1.,.64))),0.),5.);
    float edge = pow(max(dot(R,normalize(vec3(.65,.45,-1.))),0.),8.);
    shade += metal * color * (vec3(1.5,1.08,.77)*softbox + vec3(.35,.82,1.52)*edge)
      * (.79+brush*lines*.32);
    float pool = exp(-4.5*dot(p.xz-vec2(-.92,.12),p.xz-vec2(-.92,.12)));
    shade += color * studio * pool * exp(-5.*abs(p.y-.15)) * (.22+1.15*max(N.y,0.));
    if (glass > 0.) {
      float fresnel = .06 + .94*pow(1.-max(dot(N,V),0.),5.);
      float stripe = smoothstep(.22,.38,R.y)*(1.-smoothstep(.56,.72,R.y)) * (1.-smoothstep(-.55,-.12,R.x));
      shade = shade*.16 + vec3(.013,.025,.034) + vec3(.24,.41,.50)*(fresnel*.65+stripe*.43+edge*.32);
    }
    shade += color * emission;
    shade = shade / (vec3(1.) + shade);
    float fog = studio * smoothstep(7.8,13.5,length(cameraPosition-p)) * .78;
    gl_FragColor = vec4(mix(pow(shade,vec3(.72)),vec3(.0235,.0275,.0314),fog),1.);
  }
`

export function materials(gl: OGLRenderingContext, studio: boolean) {
  const create = (color: number[], metal: number, roughness: number, brush = 0, glass = 0, emission = 0) =>
    new Program(gl, {
      vertex, fragment, cullFace: false,
      uniforms: { color: { value: color }, metal: { value: metal }, roughness: { value: roughness }, brush: { value: brush }, glass: { value: glass }, emission: { value: emission }, studio: { value: Number(studio) } },
    })
  return {
    aluminum: create([.52,.57,.62], .85,.43,.85),
    bright: create([.7,.72,.74], .84,.32,.55),
    anodized: create([.085,.108,.13], .72,.43,.32),
    copper: create([.45,.235,.11], .77,.39,.66),
    dark: create([.023,.029,.036], .22,.65),
    rubber: create([.037,.041,.047], .05,.9),
    pcb: create([.041,.15,.114], .18,.57),
    gold: create([.64,.41,.15], .8,.45),
    glass: create([.016,.034,.048], .1,.25,0,1),
    white: create([.65,.78,.85], .12,.52,0,0,.48),
    signal: create([.035,.56,.35], .05,.6,0,0,.4),
    defect: create([.66,.085,.035], .22,.5,0,0,.22),
  }
}

const simpleVertex = /* glsl */`
  attribute vec3 position;
  uniform mat4 modelViewMatrix, projectionMatrix;
  uniform float pointSize;
  varying vec2 uv;
  void main(){
    uv = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
    gl_PointSize = pointSize;
  }
`
const colorFragment = /* glsl */`
  precision mediump float;
  uniform vec3 color;
  uniform float alpha;
  uniform float points;
  void main(){
    float falloff = 1.;
    if (points > .5) {
      falloff = 1. - smoothstep(.22,.5,length(gl_PointCoord-.5));
    }
    gl_FragColor = vec4(color,alpha*falloff);
  }
`

export function ink(gl: OGLRenderingContext, color: number[], alpha: number, pointSize = 0) {
  return new Program(gl, {
    vertex: simpleVertex, fragment: colorFragment, transparent: alpha < 1 || pointSize > 0, cullFace: false, depthWrite: pointSize > 0,
    uniforms: { color: { value: color }, alpha: { value: alpha }, points: { value: Number(pointSize > 0) }, pointSize: { value: pointSize } },
  })
}

export function shadowMaterial(gl: OGLRenderingContext, color: number[], glow = false) {
  return new Program(gl, {
    vertex: simpleVertex,
    fragment: /* glsl */`
      precision mediump float;
      varying vec2 uv;
      uniform vec3 color;
      uniform float glow;
      void main() {
        float d = length(uv*2.);
        float alpha = exp(-3.5*d*d) * (1.-smoothstep(.65,1.,d));
        gl_FragColor = vec4(color, alpha * mix(.85,.58,glow));
      }
    `,
    depthWrite: false, transparent: true, cullFace: false,
    uniforms: { color: { value: color }, glow: { value: Number(glow) }, pointSize: { value: 1 } },
  })
}

export function scanMaterial(gl: OGLRenderingContext) {
  return new Program(gl, {
    vertex: simpleVertex,
    fragment: /* glsl */`
      precision mediump float;
      varying vec2 uv;
      void main() {
        float edge = 1. - smoothstep(.39,.5,abs(uv.x));
        float base = exp(-13. * (uv.y + .5));
        gl_FragColor = vec4(mix(vec3(.08,.58,.43),vec3(.46,1.,.84),base),
          edge * (.13 + .64 * base) * (1. - smoothstep(.3,.5,uv.y)));
      }
    `,
    transparent: true, depthWrite: false, cullFace: false,
  })
}
