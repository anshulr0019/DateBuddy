// Analytically intersect an orthographic viewing ray with a sphere, then map
// a geographic land mask onto its rotated surface. No 3D framework.
const VERTEX = `
attribute vec2 position;
varying vec2 screen;
void main() { screen = position; gl_Position = vec4(position, 0.0, 1.0); }
`;
// A clay-like material, beveled coastline and separate cloud puffs replace
// satellite detail. All pixels outside the silhouette are transparent.
const FRAGMENT = `
precision mediump float;
varying vec2 screen;
uniform sampler2D earth;
uniform vec2 rotation;
uniform float time;
const float PI = 3.14159265;
vec3 toWorld(vec3 n) {
  float cx = cos(rotation.y), sx = sin(rotation.y);
  float cy = cos(rotation.x), sy = sin(rotation.x);
  n = vec3(n.x, n.y * cx - n.z * sx, n.y * sx + n.z * cx);
  return vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
}
vec3 toView(vec3 n) {
  float cx = cos(rotation.y), sx = sin(rotation.y);
  float cy = cos(rotation.x), sy = sin(rotation.x);
  n = vec3(n.x * cy - n.z * sy, n.y, n.x * sy + n.z * cy);
  return vec3(n.x, n.y * cx + n.z * sx, -n.y * sx + n.z * cx);
}
float landAt(vec3 normal) {
  vec3 n = toWorld(normalize(normal));
  vec2 uv = vec2(atan(n.x, n.z) / (2.0 * PI) + 0.5, asin(clamp(n.y, -1.0, 1.0)) / PI + 0.5);
  return smoothstep(0.25, 0.75, texture2D(earth, uv).r);
}
void main() {
  vec2 p = screen / 0.76;
  float r2 = dot(p, p);
  float depth = -10.0;
  float alpha = 0.0;
  vec3 color = vec3(0.0);
  vec3 light = normalize(vec3(-0.55, 0.75, 1.4));
  if (r2 < 1.0) {
    vec3 normal = vec3(p, sqrt(1.0 - r2));
    depth = normal.z;
    float land = landAt(normal);
    vec2 slope = vec2(landAt(normal + vec3(0.009, 0.0, 0.0)), landAt(normal + vec3(0.0, 0.009, 0.0))) - land;
    vec3 bevel = normalize(normal - vec3(slope * 0.55, 0.0));
    float day = max(dot(bevel, light), 0.0);
    vec3 ocean = mix(vec3(0.045, 0.30, 0.63), vec3(0.12, 0.65, 0.88), normal.y * 0.35 + 0.55);
    vec3 mint = mix(vec3(0.22, 0.64, 0.41), vec3(0.63, 0.91, 0.65), normal.y * 0.35 + 0.55);
    color = mix(ocean, mint, land) * (0.52 + day * 0.56);
    float specular = pow(max(dot(reflect(-light, bevel), vec3(0.0, 0.0, 1.0)), 0.0), 22.0);
    color += vec3(0.62, 0.85, 0.96) * specular * mix(0.28, 0.10, land);
    color += vec3(0.12, 0.40, 0.51) * pow(1.0 - normal.z, 3.0) * 0.34;
    alpha = 1.0 - smoothstep(0.994, 1.0, sqrt(r2));
  }
  // Six clusters of three rounded ellipsoids drift above the surface.
  // Compare their ray intersection depths with the globe to hide far-side clouds.
  for (int i = 0; i < 6; i++) {
    float f = float(i);
    float lon = f * 1.0472 + time * 0.024;
    float lat = sin(f * 2.4 + 0.6) * 0.66;
    vec3 center = toView(vec3(sin(lon) * cos(lat), sin(lat), cos(lon) * cos(lat))) * 1.065;
    for (int j = 0; j < 3; j++) {
      float k = float(j) - 1.0;
      vec3 c = center + vec3(k * 0.065, j == 1 ? 0.025 : 0.0, 0.0);
      vec3 radius = j == 1 ? vec3(0.087, 0.069, 0.072) : vec3(0.073, 0.046, 0.058);
      vec2 q = (p - c.xy) / radius.xy;
      float d = dot(q, q);
      if (d < 1.0) {
        float z = c.z + sqrt(1.0 - d) * radius.z;
        if (z > depth) {
          vec3 normal = normalize(vec3(q, sqrt(1.0 - d)) / radius);
          float shade = max(dot(normal, light), 0.0);
          float coverage = 1.0 - smoothstep(0.94, 1.0, d);
          vec3 cloudColor = mix(vec3(0.64, 0.78, 0.84), vec3(1.0, 0.99, 0.94), shade);
          float combinedAlpha = coverage + alpha * (1.0 - coverage);
          color = (cloudColor * coverage + color * alpha * (1.0 - coverage)) / max(combinedAlpha, 0.001);
          alpha = combinedAlpha;
          depth = z;
        }
      }
    }
  }
  // Premultiplied alpha avoids pale rectangular compositing artifacts in WebViews.
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

export function createEarthRenderer(canvas: HTMLCanvasElement, onReady: () => void, onError: () => void) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'low-power' });
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
    ['/textures/earth-land-mask.png'].forEach((src, unit) => {
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
      gl.uniform1i(gl.getUniformLocation(program!, 'earth'), unit);
      const image = new Image();
      images.push(image);
      image.onload = () => {
        if (disposed || gl.isContextLost()) return;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        loaded += 1;
        if (loaded === 1) onReady();
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
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
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
