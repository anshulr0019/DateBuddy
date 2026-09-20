// Analytically intersect an orthographic viewing ray with a sphere, then map
// real equirectangular Earth imagery onto its rotated surface. No 3D framework.
const VERTEX = `
attribute vec2 position;
varying vec2 screen;
void main() { screen = position; gl_Position = vec4(position, 0.0, 1.0); }
`;
const FRAGMENT = `
precision mediump float;
varying vec2 screen;
uniform sampler2D earth;
uniform sampler2D clouds;
uniform vec2 rotation;
uniform float time;
const float PI = 3.14159265;
void main() {
  vec2 p = screen / 0.79;
  float r = length(p);
  if (r > 1.0) {
    float halo = exp(-(r - 1.0) * 30.0) * 0.3;
    gl_FragColor = vec4(0.28, 0.65, 0.95, halo);
    return;
  }
  vec3 normal = vec3(p, sqrt(max(0.0, 1.0 - dot(p, p))));
  float cx = cos(rotation.y), sx = sin(rotation.y);
  float cy = cos(rotation.x), sy = sin(rotation.x);
  vec3 n = vec3(normal.x, normal.y * cx - normal.z * sx, normal.y * sx + normal.z * cx);
  n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  vec2 uv = vec2(atan(n.x, n.z) / (2.0 * PI) + 0.5, asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
  vec3 land = texture2D(earth, uv).rgb;
  float cloud = texture2D(clouds, vec2(fract(uv.x + time * 0.0015), uv.y)).r;
  land = mix(land, vec3(0.96, 0.98, 1.0), cloud * 0.72);
  vec3 light = normalize(vec3(-0.65, 0.5, 1.0));
  float day = max(dot(normal, light), 0.0);
  vec3 color = land * (0.16 + 0.92 * day);
  float rim = pow(1.0 - normal.z, 3.2);
  color += vec3(0.12, 0.38, 0.7) * rim * (0.4 + day * 0.6);
  gl_FragColor = vec4(color, 1.0 - smoothstep(0.994, 1.0, r));
}
`;

export function createEarthRenderer(canvas: HTMLCanvasElement, onReady: () => void, onError: () => void) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('WebGL unavailable');
  const shaders: WebGLShader[] = [];
  const textures: WebGLTexture[] = [];
  const images: HTMLImageElement[] = [];
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let disposed = false;
  const dispose = () => {
    disposed = true;
    images.forEach(image => { image.onload = null; image.onerror = null; });
    textures.forEach(texture => gl.deleteTexture(texture));
    shaders.forEach(shader => gl.deleteShader(shader));
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };
  try {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader allocation failed');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader compilation failed');
      return shader;
    };
    program = gl.createProgram();
    if (!program) throw new Error('Program allocation failed');
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader linking failed');
    gl.useProgram(program);
    buffer = gl.createBuffer();
    if (!buffer) throw new Error('Buffer allocation failed');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    let loaded = 0;
    ['/textures/earth-day.jpg', '/textures/earth-clouds.jpg'].forEach((src, unit) => {
      const texture = gl.createTexture();
      if (!texture) throw new Error('Texture allocation failed');
      textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program!, unit === 0 ? 'earth' : 'clouds'), unit);
      const image = new Image();
      images.push(image);
      image.onload = () => {
        if (disposed || gl.isContextLost()) return;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        loaded += 1;
        if (loaded === 2) onReady();
      };
      image.onerror = () => { if (!disposed) onError(); };
      image.src = src;
    });
    const rotation = gl.getUniformLocation(program, 'rotation');
    const time = gl.getUniformLocation(program, 'time');
    return {
      draw(yaw: number, pitch: number, seconds: number) {
        const size = Math.max(1, Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2)));
        if (canvas.width !== size || canvas.height !== size) {
          canvas.width = size;
          canvas.height = size;
        }
        gl.viewport(0, 0, size, size);
        gl.uniform2f(rotation, yaw, pitch);
        gl.uniform1f(time, seconds);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
