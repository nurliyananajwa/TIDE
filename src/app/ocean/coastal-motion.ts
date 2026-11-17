export type CoastalMotion = { enabled: boolean };

/** The photograph stays visible as a fallback; only water receives displacement. */
export function startCoastalMotion(canvas: HTMLCanvasElement, source: string, motion: CoastalMotion) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!context) return () => {};
  const gl=context;
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!program || !buffer || !texture) {
    if (program) gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    if (texture) gl.deleteTexture(texture);
    return () => {};
  }
  const shaders: WebGLShader[] = [];
  const sources: [number,string][] = [
    [gl.VERTEX_SHADER, `attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*0.5+0.5;gl_Position=vec4(aPosition,0.0,1.0);}`],
    [gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uPhoto;
      uniform float uTime;
      varying vec2 vUv;
      void main(){
        vec3 base=texture2D(uPhoto,vUv).rgb;
        float water=smoothstep(0.015,0.12,base.b-base.r)*(1.0-smoothstep(0.35,0.70,base.r));
        water*=1.0-smoothstep(0.86,0.94,vUv.y);
        float a=sin(vUv.y*125.0+vUv.x*41.0+uTime*0.65);
        float b=sin(vUv.x*171.0-vUv.y*58.0-uTime*0.48);
        vec2 displacement=vec2(a+b*0.4,b-a*0.3)*0.00065*water;
        vec3 color=texture2D(uPhoto,clamp(vUv+displacement,vec2(0.001),vec2(0.999))).rgb;
        color+=sin(vUv.x*270.0+vUv.y*139.0+uTime*0.55)*0.0025*water;
        gl_FragColor=vec4(color,1.0);
      }`],
  ];
  let usable = true;
  for (const [kind,sourceText] of sources) {
    const shader = gl.createShader(kind);
    if (!shader) { usable=false; break; }
    shaders.push(shader);
    gl.shaderSource(shader,sourceText);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) { usable=false; break; }
    gl.attachShader(program,shader);
  }
  gl.bindAttribLocation(program,0,"aPosition");
  gl.linkProgram(program);
  usable = usable && gl.getProgramParameter(program,gl.LINK_STATUS);
  shaders.forEach(shader=>gl.deleteShader(shader));
  if (!usable) {
    gl.deleteBuffer(buffer); gl.deleteTexture(texture); gl.deleteProgram(program);
    return () => {};
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program,"uPhoto"),0);
  const timeUniform = gl.getUniformLocation(program,"uTime");
  let ready=false, disposed=false, visible=!document.hidden, dirty=true;
  let frame=0, last=0, elapsed=0;
  const photograph=new window.Image();
  photograph.onload=()=>{
    if (disposed || gl.isContextLost()) return;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,photograph);
    ready=true;
    dirty=true;
  };
  photograph.src=source;
  const resize=new ResizeObserver(([entry])=>{
    const scale=Math.min(window.devicePixelRatio||1,1.25);
    canvas.width=Math.max(1,Math.round(entry.contentRect.width*scale));
    canvas.height=Math.max(1,Math.round(entry.contentRect.height*scale));
    gl.viewport(0,0,canvas.width,canvas.height);
    dirty=true;
  });
  resize.observe(canvas);
  const onVisibility=()=>{ visible=!document.hidden;last=0;dirty=true; };
  const onContextLost=(event:Event)=>{
    event.preventDefault();
    ready=false;
    canvas.removeAttribute("data-ready");
    cancelAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange",onVisibility);
  canvas.addEventListener("webglcontextlost",onContextLost);
  function draw(time:number) {
    frame=requestAnimationFrame(draw);
    if (!visible || !ready) { last=0;return; }
    const delta=last?Math.min((time-last)/1000,0.05):0;
    last=time;
    if (!motion.enabled && !dirty) return;
    if (motion.enabled) elapsed+=delta;
    gl.uniform1f(timeUniform,elapsed);
    gl.drawArrays(gl.TRIANGLES,0,6);
    canvas.dataset.ready="true";
    dirty=false;
  }
  frame=requestAnimationFrame(draw);
  return ()=>{
    disposed=true;
    cancelAnimationFrame(frame);
    photograph.onload=null;
    resize.disconnect();
    document.removeEventListener("visibilitychange",onVisibility);
    canvas.removeEventListener("webglcontextlost",onContextLost);
    gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);
  };
}
