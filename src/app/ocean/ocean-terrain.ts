import { oceanStages } from "./ocean-stages";

export const terrainExtent = 88;
export const terrainSize = 512;
const minimumHeight = -12;
const heightRange = 28;

type Formation = { x: number; z: number; rx: number; rz: number; angle: number; height: number; seed: number };

const mainProfiles = [
  { rx: 12.8, rz: 7.4, angle: -0.48, height: 4.0, seed: 13 },
  { rx: 14.7, rz: 6.1, angle: -0.60, height: 4.5, seed: 37 },
  { rx: 10.7, rz: 8.2, angle: -0.35, height: 5.1, seed: 71 },
  { rx: 12.0, rz: 6.5, angle: -0.64, height: 3.6, seed: 103 },
];

// The report destinations belong to one continuous geological region.
const formations: Formation[] = [
  ...oceanStages.map((stage, index) => ({ x: stage.x, z: stage.z, ...mainProfiles[index] })),
  { x:-54,z:-21,rx:18,rz:9,angle:-0.55,height:5.3,seed:131 },
  { x:-44,z:1,rx:4.2,rz:2.1,angle:-0.6,height:1.7,seed:149 },
  { x:-37,z:12,rx:3.4,rz:1.8,angle:-0.5,height:1.2,seed:167 },
  { x:-27,z:21,rx:5.7,rz:3.0,angle:-0.8,height:2.2,seed:181 },
  { x:-16,z:-33,rx:4.1,rz:2.0,angle:-0.4,height:1.9,seed:197 },
  { x:12,z:-45,rx:9.3,rz:4.2,angle:-0.5,height:3.3,seed:211 },
  { x:33,z:-38,rx:13.3,rz:6.5,angle:-0.7,height:4.6,seed:229 },
  { x:40,z:-19,rx:5.8,rz:2.7,angle:-0.3,height:2.2,seed:251 },
  { x:54,z:0,rx:14,rz:7.6,angle:-0.5,height:4.3,seed:269 },
  { x:37,z:26,rx:3.4,rz:1.9,angle:-0.65,height:1.4,seed:283 },
  { x:19,z:23,rx:3.1,rz:1.7,angle:-0.6,height:1.1,seed:307 },
  { x:10,z:43,rx:8.4,rz:3.9,angle:-0.7,height:2.7,seed:331 },
  { x:-28,z:49,rx:14.1,rz:7.0,angle:-0.5,height:4.2,seed:347 },
  { x:1,z:-66,rx:19.6,rz:8.7,angle:-0.5,height:4.8,seed:367 },
  { x:-45,z:-55,rx:18.5,rz:8.1,angle:-0.7,height:5.7,seed:389 },
  { x:61,z:46,rx:11.6,rz:5.6,angle:-0.6,height:3.8,seed:409 },
];

function hash(x: number, z: number) {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function noise(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

const orientedFormations = formations.map(formation => ({ ...formation, cos: Math.cos(formation.angle), sin: Math.sin(formation.angle) }));

function elevation(x: number, z: number) {
  let height = -10 + noise(x * 0.04, z * 0.04) * 1.2;
  for (const f of orientedFormations) {
    const dx = x - f.x, dz = z - f.z;
    if (Math.abs(dx) > f.rx + f.rz + 7 || Math.abs(dz) > f.rx + f.rz + 7) continue;
    const u = dx * f.cos + dz * f.sin, v = -dx * f.sin + dz * f.cos;
    const radius = Math.hypot(u / f.rx, v / f.rz);
    if (radius > 2.3) continue;
    const roughness = (noise(x * 0.22 + f.seed, z * 0.22) - 0.5) * 0.30
      + (noise(x * 0.64, z * 0.64 + f.seed) - 0.5) * 0.10;
    const coastalEdge = (1 - radius + roughness) * Math.min(f.rx, f.rz);
    const bayU = (noise(f.seed,0.0)-0.5)*f.rx*0.8;
    const bayV = f.rz*(f.seed%3===0?-0.94:0.92);
    const bayRadius = f.rz*(0.30+noise(f.seed,3.0)*0.23);
    const bayEdge = Math.hypot((u-bayU)*0.85,v-bayV)-bayRadius;
    const edge = Math.min(coastalEdge,bayEdge);
    const inland = Math.max(0, Math.min(1, edge / 1.8));
    const ridgeA = Math.exp(-((u + f.rx * 0.25) ** 2 / (f.rx * f.rx * 0.21) + (v + f.rz * 0.14) ** 2 / (f.rz * f.rz * 0.18)));
    const ridgeB = Math.exp(-((u - f.rx * 0.28) ** 2 / (f.rx * f.rx * 0.12) + (v - f.rz * 0.08) ** 2 / (f.rz * f.rz * 0.30)));
    const erosion = 0.56 + noise(x * 0.43 + f.seed, z * 0.43) * 0.44;
    const land = -0.28 + edge * (edge > 0 ? 0.40 : 1.05) + Math.max(ridgeA, ridgeB * 0.8) * f.height * erosion * inland;
    // A broad submerged shelf follows the same ridge as the emerged land.
    const shelf = -4.6 - Math.max(0, radius - 1.1) * 5 + roughness * 1.2;
    const t = Math.max(0,Math.min(1,(radius-1.45)/0.80));
    const fade = t*t*(3-2*t);
    height = Math.max(height,Math.max(land,shelf)*(1-fade)-11*fade);
  }
  return Math.max(minimumHeight, Math.min(minimumHeight + heightRange, height));
}

export function createArchipelago() {
  const heights = new Float32Array(terrainSize * terrainSize);
  const pixels = new Uint8Array(terrainSize * terrainSize * 4);
  for (let row = 0; row < terrainSize; row++) {
    for (let col = 0; col < terrainSize; col++) {
      const index = row * terrainSize + col;
      const height = elevation((col / (terrainSize - 1) * 2 - 1) * terrainExtent, (row / (terrainSize - 1) * 2 - 1) * terrainExtent);
      const encoded = Math.round((height - minimumHeight) / heightRange * 65535);
      heights[index] = height;
      pixels[index * 4] = encoded >>> 8;
      pixels[index * 4 + 1] = encoded & 255;
      pixels[index * 4 + 3] = 255;
    }
  }

  function sample(x: number, z: number) {
    const u = Math.max(0, Math.min(terrainSize - 1.001, (x / terrainExtent * 0.5 + 0.5) * (terrainSize - 1)));
    const v = Math.max(0, Math.min(terrainSize - 1.001, (z / terrainExtent * 0.5 + 0.5) * (terrainSize - 1)));
    const col = Math.floor(u), row = Math.floor(v), fx = u - col, fz = v - row;
    const a = heights[row * terrainSize + col], b = heights[row * terrainSize + col + 1];
    const c = heights[(row + 1) * terrainSize + col], d = heights[(row + 1) * terrainSize + col + 1];
    return (a + (b - a) * fx) * (1 - fz) + (c + (d - c) * fx) * fz;
  }

  const land: number[] = [];
  const resolution = 360, cell = terrainExtent * 2 / resolution;
  function vertex(x: number, z: number) {
    const nx = sample(x - 0.22, z) - sample(x + 0.22, z);
    const nz = sample(x, z - 0.22) - sample(x, z + 0.22);
    const length = Math.hypot(nx, 0.44, nz);
    land.push(x, sample(x, z), z, nx / length, 0.44 / length, nz / length);
  }
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const x = -terrainExtent + col * cell, z = -terrainExtent + row * cell;
      if (Math.max(sample(x,z),sample(x+cell,z),sample(x,z+cell),sample(x+cell,z+cell)) < -0.25) continue;
      vertex(x,z); vertex(x+cell,z); vertex(x,z+cell);
      vertex(x+cell,z); vertex(x+cell,z+cell); vertex(x,z+cell);
    }
  }

  const trees: number[] = [];
  let seed = 731;
  const random = () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const formation of formations) {
    const count = Math.round(formation.rx * formation.rz * 18);
    const cos = Math.cos(formation.angle), sin = Math.sin(formation.angle);
    for (let tree = 0; tree < count; tree++) {
      const u = (random() * 2 - 1) * formation.rx, v = (random() * 2 - 1) * formation.rz;
      const x = formation.x + u * cos - v * sin, z = formation.z + u * sin + v * cos;
      const h = sample(x,z);
      const slope = Math.hypot(sample(x+0.2,z)-sample(x-0.2,z),sample(x,z+0.2)-sample(x,z-0.2));
      if (h < 0.65 || slope > 0.60 || noise(x * 0.7,z * 0.7) < 0.20) continue;
      trees.push(x,h + 0.25,z);
    }
  }

  return { pixels, land: new Float32Array(land), trees: new Float32Array(trees), sample };
}
