import { oceanStages } from "./ocean-stages";
import { createArchipelago, terrainSize } from "./ocean-terrain";
import { waterVertex, waterFragment, landVertex, landFragment, skyVertex, skyFragment, forestVertex, forestFragment } from "./ocean-shaders";

export type OceanInput = {
  selected: number | null;
  motion: boolean;
  pointerX: number;
  pointerY: number;
  orbitYaw: number;
  orbitPitch: number;
  zoom: number;
  navigating: boolean;
  dragging: boolean;
};

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) out[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
    }
  }
  return out;
}

function cameraMatrix(eye: number[], target: number[], aspect: number) {
  const normalize = (v: number[]) => { const length = Math.hypot(...v); return v.map(n => n / length); };
  const z = normalize(eye.map((n, i) => n - target[i]));
  const x = normalize([z[2], 0, -z[0]]);
  const y = [z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
  const dot = (a: number[], b: number[]) => a.reduce((sum, n, i) => sum + n * b[i], 0);
  const view = new Float32Array([
    x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
  const f = 1 / Math.tan(Math.PI / 7);
  const near = 0.1, far = 500;
  const projection = new Float32Array([
    f/aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far+near)/(near-far), -1,
    0, 0, 2*far*near/(near-far), 0,
  ]);
  return multiply(projection, view);
}

function mesh(extent: number, resolution: number) {
  const vertices: number[] = [];
  const cell = extent * 2 / resolution;
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const x = -extent + col * cell, z = -extent + row * cell;
      vertices.push(x, z, x+cell, z, x, z+cell, x+cell, z, x+cell, z+cell, x, z+cell);
    }
  }
  return new Float32Array(vertices);
}

export function startOcean(
  canvas: HTMLCanvasElement,
  markers: HTMLButtonElement[],
  input: OceanInput,
  onUnavailable: () => void,
) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: true, powerPreference: "low-power" });
  if (!context) throw new Error("WebGL unavailable");
  const gl = context;
  const programs: WebGLProgram[] = [];
  const buffers: WebGLBuffer[] = [];
  const heightMap = gl.createTexture();
  if (!heightMap) throw new Error("Could not allocate ocean terrain");

  function program(vertexSource: string, fragmentSource: string) {
    const result = gl.createProgram();
    if (!result) throw new Error("Could not allocate ocean program");
    programs.push(result);
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Could not allocate ocean shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error || "Ocean shader compilation failed");
      }
      gl.attachShader(result, shader);
      gl.deleteShader(shader);
    }
    gl.bindAttribLocation(result, 0, "aPosition");
    gl.bindAttribLocation(result, 1, "aNormal");
    gl.linkProgram(result);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result) || "Ocean program linking failed");
    return result;
  }

  function geometry(vertices: Float32Array, components = 2) {
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("Could not allocate ocean geometry");
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    return { buffer, count: vertices.length / components };
  }

  let sky: WebGLProgram, surface: WebGLProgram, forest: WebGLProgram, land: WebGLProgram;
  let skyMesh: ReturnType<typeof geometry>, waterMesh: ReturnType<typeof geometry>, islandMesh: ReturnType<typeof geometry>;
  let trees: ReturnType<typeof geometry>;
  let archipelago: ReturnType<typeof createArchipelago>;
  try {
    archipelago = createArchipelago();
    gl.bindTexture(gl.TEXTURE_2D, heightMap);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,terrainSize,terrainSize,0,gl.RGBA,gl.UNSIGNED_BYTE,archipelago.pixels);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    sky = program(skyVertex, skyFragment);
    surface = program(waterVertex, waterFragment);
    forest = program(forestVertex, forestFragment);
    land = program(landVertex, landFragment);
    skyMesh = geometry(mesh(1, 1));
    waterMesh = geometry(mesh(300, 110));
    islandMesh = geometry(archipelago.land,6);
    trees = geometry(archipelago.trees,3);
  } catch (error) {
    programs.forEach(p => gl.deleteProgram(p));
    buffers.forEach(b => gl.deleteBuffer(b));
    gl.deleteTexture(heightMap);
    throw error;
  }
  const uniforms = Object.fromEntries(["uMatrix", "uTime", "uEye", "uHeightMap"].map(name => [name, gl.getUniformLocation(surface, name)]));
  const horizonUniform = gl.getUniformLocation(sky, "uHorizon");
  const forestUniforms = Object.fromEntries(["uMatrix", "uPixels", "uEye"].map(name => [name, gl.getUniformLocation(forest, name)]));
  const landUniforms = Object.fromEntries(["uMatrix", "uEye", "uHeightMap"].map(name => [name, gl.getUniformLocation(land, name)]));
  const markerHeights = oceanStages.map(stage => Math.max(0.6,archipelago.sample(stage.x+stage.scale,stage.z+3*stage.scale))+0.8);
  let width = 1, height = 1, frame = 0, previousTime = 0, elapsed = 0;
  let visible = !document.hidden;
  const eye = [14, 52, 92], target = [0, 0, 0];
  let pausedView = "";
  const resize = new ResizeObserver(([entry]) => {
    width = Math.max(entry.contentRect.width, 1);
    height = Math.max(entry.contentRect.height, 1);
    const scale = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.25 : 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  });
  resize.observe(canvas);
  const visibility = () => { visible = !document.hidden; previousTime = 0; };
  document.addEventListener("visibilitychange", visibility);
  const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); onUnavailable(); };
  canvas.addEventListener("webglcontextlost", contextLost);

  function drawGeometry(data: ReturnType<typeof geometry>) {
    gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, data.count);
  }

  function render(time: number) {
    frame = requestAnimationFrame(render);
    if (!visible) return;
    const signature = [width, height, input.selected, input.orbitYaw, input.orbitPitch, input.zoom, input.navigating].join(":");
    if (!input.motion && signature === pausedView) return;
    pausedView = input.motion ? "" : signature;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    if (input.motion) elapsed += delta;
    const mobile = width < 700;
    const activeStage = input.selected === null ? null : oceanStages[input.selected];
    const desiredEye = activeStage
      ? (mobile ? [activeStage.x + 30, 27, activeStage.z + 48] : [activeStage.x + 22, 17, activeStage.z + 36])
      : (mobile ? [14, 105, 175] : [14, 52, 92]);
    const desiredTarget = activeStage
      ? [activeStage.x + (mobile ? 0 : 5), 1, activeStage.z]
      : [0, 0, 0];
    const offset = desiredEye.map((value, i) => value - desiredTarget[i]);
    const radius = Math.hypot(...offset) * input.zoom;
    const azimuth = Math.atan2(offset[0], offset[2]) + input.orbitYaw;
    const elevation = Math.max(0.1, Math.min(1.05, Math.atan2(offset[1], Math.hypot(offset[0], offset[2])) + input.orbitPitch));
    desiredEye[0] = desiredTarget[0] + radius * Math.sin(azimuth) * Math.cos(elevation);
    desiredEye[1] = desiredTarget[1] + radius * Math.sin(elevation);
    desiredEye[2] = desiredTarget[2] + radius * Math.cos(azimuth) * Math.cos(elevation);
    const damping = input.dragging || !input.motion ? 1 : 1 - Math.exp(-delta * 5);
    desiredEye[0] += input.motion ? input.pointerX * 1.7 : 0;
    desiredEye[1] += input.motion ? input.pointerY * 0.5 : 0;
    for (let i = 0; i < 3; i++) {
      eye[i] += (desiredEye[i] - eye[i]) * damping;
      target[i] += (desiredTarget[i] - target[i]) * damping;
    }
    const matrix = cameraMatrix(eye, target, width / height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(sky);
    const horizontalDistance = Math.hypot(eye[0] - target[0], eye[2] - target[2]);
    gl.uniform1f(horizonUniform, 0.5 + (eye[1] - target[1]) / horizontalDistance / (2 * Math.tan(Math.PI / 7)));
    drawGeometry(skyMesh);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(surface);
    gl.uniformMatrix4fv(uniforms.uMatrix, false, matrix);
    gl.uniform1f(uniforms.uTime, elapsed);
    gl.uniform3f(uniforms.uEye, eye[0], eye[1], eye[2]);
    gl.uniform1i(uniforms.uHeightMap,0);
    drawGeometry(waterMesh);
    gl.useProgram(land);
    gl.uniformMatrix4fv(landUniforms.uMatrix,false,matrix);
    gl.uniform3f(landUniforms.uEye,eye[0],eye[1],eye[2]);
    gl.uniform1i(landUniforms.uHeightMap,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,islandMesh.buffer);
    gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
    gl.drawArrays(gl.TRIANGLES,0,islandMesh.count);
    gl.disableVertexAttribArray(1);
    gl.useProgram(forest);
    gl.uniformMatrix4fv(forestUniforms.uMatrix, false, matrix);
    gl.uniform1f(forestUniforms.uPixels, canvas.height);
    gl.uniform3f(forestUniforms.uEye, eye[0], eye[1], eye[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, trees.buffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, trees.count);
    oceanStages.forEach((stage, index) => {
      const marker = markers[index];
      const point = [stage.x + stage.scale, markerHeights[index], stage.z + 3 * stage.scale];
      const clip = [0, 1, 3].map(row => matrix[row]*point[0]+matrix[4+row]*point[1]+matrix[8+row]*point[2]+matrix[12+row]);
      const px = (clip[0]/clip[2]*0.5+0.5)*width;
      const py = (-clip[1]/clip[2]*0.5+0.5)*height;
      marker.style.visibility = clip[2] <= 0 || px < -100 || px > width + 100 || py < 80 || py > height - 95 || (input.selected !== null && input.selected !== index) ? "hidden" : "visible";
      marker.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-28px, -50%)`;
    });
  }
  frame = requestAnimationFrame(render);
  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", contextLost);
    programs.forEach(p => gl.deleteProgram(p));
    buffers.forEach(b => gl.deleteBuffer(b));
    gl.deleteTexture(heightMap);
  };
}
