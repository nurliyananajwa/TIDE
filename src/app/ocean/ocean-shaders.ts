import { terrainExtent, terrainSize } from "./ocean-terrain";

const terrainLookup = `
uniform sampler2D uHeightMap;
float terrain(vec2 p) {
  if (max(abs(p.x), abs(p.y)) > ${terrainExtent.toFixed(1)}) return -12.0;
  vec2 uv = (p / ${terrainExtent.toFixed(1)} * 0.5 + 0.5) * ${(terrainSize - 1) / terrainSize} + ${0.5 / terrainSize};
  vec2 packedHeight = texture2D(uHeightMap, uv).rg;
  return -12.0 + dot(packedHeight, vec2(256.0, 1.0)) * ${28 * 255 / 65535};
}
`;

const noise = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
}
`;

const waves = `
float wave(vec2 p, float t) {
  return sin(dot(p, vec2(0.42,0.29)) + t * 0.62) * 0.085
    + sin(dot(p, vec2(-0.31,0.57)) + t * 0.81 + sin(p.x * 0.11)) * 0.055
    + sin(dot(p, vec2(1.13,0.19)) - t * 0.67 + sin(p.y * 0.17)) * 0.022;
}
`;

export const waterVertex = `
precision highp float;
attribute vec2 aPosition;
uniform mat4 uMatrix;
uniform float uTime;
varying vec3 vWorld;
${waves}
void main() {
  vWorld = vec3(aPosition.x, wave(aPosition,uTime), aPosition.y);
  gl_Position = uMatrix * vec4(vWorld,1.0);
}
`;

export const waterFragment = `
precision highp float;
uniform vec3 uEye;
uniform float uTime;
varying vec3 vWorld;
${terrainLookup}
${noise}
${waves}
void main() {
  vec2 p = vWorld.xz;
  float warp = noise(p * 0.33 + uTime * vec2(-0.035,0.016));
  vec2 swell = p + vec2(warp,-warp) * 0.85;
  float dx = wave(swell+vec2(0.08,0),uTime)-wave(swell-vec2(0.08,0),uTime);
  float dz = wave(swell+vec2(0,0.08),uTime)-wave(swell-vec2(0,0.08),uTime);
  vec3 normal = normalize(vec3(-dx,0.22,-dz));
  vec3 viewDirection = normalize(uEye-vWorld);
  vec3 sun = normalize(vec3(-0.55,0.82,0.34));
  float depth = terrain(p);
  float shallow = exp(min(-0.1,depth) * 0.48);
  vec3 color = mix(vec3(0.018,0.155,0.205), vec3(0.13,0.43,0.40),shallow);
  float seabed = noise(p * 0.8) * 0.55 + noise(p * 2.4) * 0.25;
  color += vec3(0.040,0.070,0.035) * seabed * shallow;
  float fresnel = 0.035 + 0.65 * pow(1.0-max(dot(viewDirection,normal),0.0),5.0);
  vec3 sky = mix(vec3(0.56,0.72,0.78),vec3(0.22,0.45,0.58),max(0.0,reflect(-viewDirection,normal).y));
  color = mix(color,sky,fresnel);
  float glint = pow(max(dot(normal,normalize(sun+viewDirection)),0.0),150.0);
  color += vec3(0.90,0.86,0.70) * glint * 0.52;
  float wash = sin(depth * 9.0 + uTime * 1.4 + noise(p * 1.5) * 4.0);
  float foam = (1.0-smoothstep(0.04,0.30,abs(depth+0.05))) * smoothstep(-0.2,0.9,wash);
  color = mix(color,vec3(0.80,0.86,0.80),foam*0.42);
  float shoreShadow = smoothstep(0.0,2.0,terrain(p+vec2(-1.5,0.9)));
  color *= 1.0-shoreShadow*0.13;
  float distanceToEye=length(uEye-vWorld);
  float haze=max(1.0-exp(-distanceToEye*0.0018),smoothstep(140.0,285.0,distanceToEye));
  color = mix(color,vec3(0.60,0.73,0.77),haze);
  gl_FragColor=vec4(color,1.0);
}
`;

export const landVertex = `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aNormal;
uniform mat4 uMatrix;
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vWorld=aPosition;
  vNormal=aNormal;
  gl_Position=uMatrix*vec4(aPosition,1.0);
}
`;

export const landFragment = `
precision highp float;
uniform vec3 uEye;
varying vec3 vWorld;
varying vec3 vNormal;
${terrainLookup}
${noise}
void main() {
  if (vWorld.y < -0.04) discard;
  vec2 p=vWorld.xz;
  vec3 normal=normalize(vNormal);
  vec3 sun=normalize(vec3(-0.55,0.82,0.34));
  float detail=noise(p*2.4)*0.65+noise(p*7.2)*0.35;
  float cover=smoothstep(0.18,0.78,vWorld.y+noise(p*1.1)*0.28);
  vec3 sand=mix(vec3(0.55,0.55,0.43),vec3(0.77,0.74,0.58),smoothstep(0.0,0.55,vWorld.y));
  vec3 vegetation=mix(vec3(0.10,0.24,0.16),vec3(0.23,0.35,0.19),noise(p*0.7));
  vec3 rock=mix(vec3(0.35,0.36,0.31),vec3(0.49,0.48,0.39),detail);
  vec3 color=mix(sand,vegetation,cover);
  float cliff=(1.0-smoothstep(0.54,0.86,normal.y))*cover;
  color=mix(color,rock,cliff*0.88);
  color*=0.85+detail*0.25;
  float shadow=0.0;
  shadow=max(shadow,smoothstep(0.1,1.0,terrain(p+sun.xz*2.0)-(vWorld.y+sun.y*2.0)));
  shadow=max(shadow,smoothstep(0.2,1.8,terrain(p+sun.xz*5.0)-(vWorld.y+sun.y*5.0)));
  color*=0.52+0.57*max(dot(normal,sun),0.0)*(1.0-shadow*0.55);
  color=mix(color,vec3(0.60,0.73,0.77),1.0-exp(-length(uEye-vWorld)*0.0028));
  gl_FragColor=vec4(color,1.0);
}
`;

export const skyVertex = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() { vUv=aPosition*0.5+0.5; gl_Position=vec4(aPosition,1.0,1.0); }
`;
export const skyFragment = `
precision mediump float;
uniform float uHorizon;
varying vec2 vUv;
void main() {
  float skyHeight=max(0.0,(vUv.y-uHorizon)/max(0.12,1.0-uHorizon));
  vec3 color=mix(vec3(0.60,0.73,0.77),vec3(0.23,0.46,0.59),smoothstep(0.0,1.0,skyHeight));
  color+=vec3(0.13,0.11,0.07)*exp(-length((vUv-vec2(0.70,uHorizon+0.06))*vec2(2.0,3.4))*4.0);
  gl_FragColor=vec4(color,1.0);
}
`;

export const forestVertex = `
precision highp float;
attribute vec3 aPosition;
uniform mat4 uMatrix;
uniform float uPixels;
uniform vec3 uEye;
varying float vShade;
varying float vFog;
void main() {
  float seed=fract(sin(dot(aPosition.xz,vec2(127.1,311.7)))*43758.5453);
  gl_Position=uMatrix*vec4(aPosition,1.0);
  gl_PointSize=clamp(uPixels*(0.42+seed*0.24)/gl_Position.w,1.0,16.0);
  vShade=seed;
  vFog=1.0-exp(-length(aPosition-uEye)*0.0028);
}
`;
export const forestFragment = `
precision mediump float;
varying float vShade;
varying float vFog;
void main() {
  vec2 p=gl_PointCoord*2.0-1.0;
  float r=dot(p,p);
  if (r>1.0) discard;
  float light=0.55+0.38*max(0.0,dot(normalize(vec3(p.x,sqrt(1.0-r),p.y)),normalize(vec3(-0.55,0.82,0.34))));
  vec3 color=mix(vec3(0.09,0.22,0.13),vec3(0.24,0.34,0.17),vShade)*light;
  gl_FragColor=vec4(mix(color,vec3(0.60,0.73,0.77),vFog),1.0);
}
`;
