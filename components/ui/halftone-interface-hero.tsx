"use client";

/**
 * Halftone Interface Hero
 *
 * A full-screen identity field with a WebGL halftone wordmark and a separate
 * RGB particle trail. The shader treats the wordmark as a height map: ordered
 * dithering, directional lighting, cursor-steered normals, and offset color
 * samples give each grid cell its dimensional, chromatic response.
 *
 * The wordmark texture is generated at runtime, so the component has no image,
 * font, or animation-library dependency.
 *
 * BLANK, aryank.space
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createVisibleRenderLoop, getSceneBufferSize } from "./deadspace-page/render-loop";

export interface HalftoneHeroLink {
  label: string;
  href: string;
}

export interface HalftoneInterfaceHeroProps {
  headline?: [string, string];
  navigation?: HalftoneHeroLink[];
  utilityLinks?: HalftoneHeroLink[];
  brand?: [string, string];
  footerLabel?: string;
  locationLabel?: string;
  timeZone?: string;
  background?: string;
  foreground?: string;
  accentColors?: [string, string, string];
  className?: string;
  embedded?: boolean;
  fontFamily?: string;
  onReady?: (ready: boolean) => void;
}

type TrailParticle = {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  size: number;
};

const DEFAULT_NAVIGATION: HalftoneHeroLink[] = [
  { label: "events", href: "#events" },
  { label: "interfaces", href: "#interfaces" },
  { label: "people", href: "#people" },
  { label: "about", href: "#about" },
];

const DEFAULT_UTILITY_LINKS: HalftoneHeroLink[] = [
  { label: "follow", href: "#follow" },
  { label: "subscribe", href: "#subscribe" },
];

const DEFAULT_HEADLINE: [string, string] = ["blank", "interfaces"];
const DEFAULT_BRAND: [string, string] = ["blank", "interfaces"];
const DEFAULT_ACCENTS: [string, string, string] = [
  "#ff266c",
  "#1cffaf",
  "#5848ff",
];

const VERTEX_SHADER = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 color;

uniform vec2 resolution;
uniform vec2 pointer;
uniform float hover;
uniform float pixelRatio;
uniform sampler2D wordmark;
uniform float wordmarkAspect;
uniform vec3 inkColor;
uniform float compact;
uniform float wordmarkY;
uniform vec3 warmColor;
uniform vec3 middleColor;
uniform vec3 coolColor;

vec2 fittedWordmarkSize() {
  float horizontalFill = mix(0.82, 0.92, compact);
  float verticalFill = mix(0.66, 0.58, compact);
  float fittedWidth = min(
    resolution.x * horizontalFill,
    resolution.y * verticalFill * wordmarkAspect
  );
  return vec2(fittedWidth, fittedWidth / wordmarkAspect);
}

float sampleWordmark(vec2 pixel) {
  vec2 center = vec2(resolution.x * 0.5, resolution.y * wordmarkY);
  vec2 uv = (pixel - center) / fittedWordmarkSize() + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return 0.0;
  }
  vec4 sampleColor = texture(wordmark, uv);
  return sampleColor.a * max(max(sampleColor.r, sampleColor.g), sampleColor.b);
}

float orderedDither(ivec2 cell) {
  int x = cell.x & 3;
  int y = cell.y & 3;
  int index = y * 4 + x;
  float matrix[16] = float[16](
    0.0, 8.0, 2.0, 10.0,
    12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,
    15.0, 7.0, 13.0, 5.0
  );
  return (matrix[index] + 0.5) / 16.0;
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  float pointerDistance = distance(pixel, pointer);

  float lightRadius = max(resolution.x, resolution.y) * mix(0.50, 0.26, compact);
  float proximity = 1.0 - smoothstep(0.0, lightRadius, pointerDistance);
  proximity = pow(proximity, mix(0.55, 0.85, compact));
  float idleRelief = mix(0.55, 0.18, compact);
  float relief = proximity * (idleRelief + 0.65 * hover);

  float colorRadius = min(resolution.x, resolution.y) * mix(0.22, 0.14, compact);
  float colorInfluence = (1.0 - smoothstep(0.0, colorRadius, pointerDistance)) * hover;

  float cellSize = mix(10.0, 3.75, compact) * pixelRatio;
  vec2 cellIndex = floor(pixel / cellSize);
  vec2 cellCenter = (cellIndex + 0.5) * cellSize;

  vec2 radialDirection = normalize(pixel - pointer + vec2(0.0001));
  float colorOffset = colorInfluence * mix(11.0, 5.0, compact) * pixelRatio;

  float centerHeight = sampleWordmark(cellCenter);
  float warmHeight = sampleWordmark(cellCenter + radialDirection * colorOffset);
  float coolHeight = sampleWordmark(cellCenter - radialDirection * colorOffset);
  float heightX = sampleWordmark(cellCenter + vec2(cellSize, 0.0));
  float heightY = sampleWordmark(cellCenter + vec2(0.0, cellSize));

  float raisedHeight = centerHeight * relief;
  vec3 surfaceNormal = normalize(vec3(
    centerHeight - heightX,
    centerHeight - heightY,
    0.55 - raisedHeight * 0.45
  ));

  vec3 restingLight = normalize(vec3(-0.35, 0.4, 0.85));
  vec3 cursorLight = normalize(vec3(normalize(pointer - cellCenter + vec2(0.0001)), 0.8));
  vec3 lightDirection = normalize(mix(restingLight, cursorLight, relief));
  float diffuse = max(dot(surfaceNormal, lightDirection), 0.0);
  float highlight = pow(diffuse, 18.0) * relief;
  float lighting = clamp(0.45 + 0.65 * diffuse + highlight, 0.0, 1.4);

  float threshold = orderedDither(ivec2(cellIndex));
  float binaryTone = step(threshold, lighting);
  float tone = mix(
    lighting,
    binaryTone * (0.55 + 0.45 * lighting),
    mix(0.5, 0.1, compact)
  );

  // A circle larger than half a grid cell is clipped by that cell. The result
  // is the rounded-square tile visible in the reference rather than a circle.
  float distanceFromCellCenter = distance(pixel, cellCenter);
  float antialias = 1.2 * pixelRatio;
  float warmRadius = sqrt(warmHeight) * cellSize * mix(0.64, 0.72, compact);
  float centerRadius = sqrt(centerHeight) * cellSize * mix(0.64, 0.72, compact);
  float coolRadius = sqrt(coolHeight) * cellSize * mix(0.64, 0.72, compact);

  float warmInk = 1.0 - smoothstep(
    warmRadius - antialias,
    warmRadius + antialias,
    distanceFromCellCenter
  );
  float centerInk = 1.0 - smoothstep(
    centerRadius - antialias,
    centerRadius + antialias,
    distanceFromCellCenter
  );
  float coolInk = 1.0 - smoothstep(
    coolRadius - antialias,
    coolRadius + antialias,
    distanceFromCellCenter
  );

  float coverage = max(centerHeight, max(warmHeight, coolHeight));
  float coverageGate = smoothstep(0.015, 0.12, coverage);
  vec3 channels = vec3(warmInk, centerInk, coolInk) * tone;

  vec3 finalInk = inkColor * channels.g;
  vec3 fringe = (channels - vec3(channels.g)) * colorInfluence * 2.2;
  fringe = vec3(
    fringe.r + fringe.g * 0.04 + fringe.b * 0.09,
    fringe.r * 0.02 + fringe.g + fringe.b * 0.05,
    fringe.r * 0.07 + fringe.g * 0.03 + fringe.b
  );
  finalInk = clamp(finalInk + fringe.r * warmColor + fringe.g * middleColor + fringe.b * coolColor, 0.0, 1.0);

  float alpha = max(max(channels.r, channels.g), channels.b) * coverageGate;
  color = vec4(finalInk, clamp(alpha, 0.0, 1.0));
}
`;

function hexToRgb(color: string): [number, number, number] {
  const value = color.trim().replace(/^#/, "");
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  if (!/^[\da-f]{6}$/i.test(expanded)) return [1, 1, 1];
  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
  ];
}

function createWordmarkTexture(headline: [string, string], fontFamily: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1912;
  canvas.height = 758;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  ctx.fontKerning = "normal";

  const drawFittedLine = (
    text: string,
    x: number,
    baseline: number,
    targetWidth: number,
    fontSize: number,
    weight: number,
  ) => {
    ctx.save();
    ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
    const measuredWidth = Math.max(1, ctx.measureText(text).width);
    ctx.translate(x, 0);
    ctx.scale(targetWidth / measuredWidth, 1);
    ctx.fillText(text, 0, baseline);
    ctx.restore();
  };

  if (!headline[1].trim()) {
    ctx.font = `800 620px ${fontFamily}`;
    const metrics = ctx.measureText(headline[0]);
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    drawFittedLine(headline[0], 40, (canvas.height + ascent - descent) / 2, 1832, 620, 800);
    return canvas;
  }
  drawFittedLine(headline[0], 15, 306, 960, 383, 500);
  drawFittedLine(headline[1], 20, 690, 1870, 504, 400);
  return canvas;
}

function compileShader(
  gl: WebGL2RenderingContext,
  kind: number,
  source: string,
) {
  const shader = gl.createShader(kind);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function HalftoneCanvas({
  headline, foreground, accentColors, fontFamily, embedded, onReady,
}: {
  headline: [string, string];
  foreground: string;
  accentColors: [string, string, string];
  fontFamily: string;
  embedded: boolean;
  onReady: (ready: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    const candidateCanvas = canvasRef.current;
    const candidateParent = candidateCanvas?.parentElement;
    if (!candidateCanvas || !candidateParent) return;
    const canvas = candidateCanvas;
    const parent = candidateParent;
    onReady(false);
    const context = canvas.getContext("webgl2", {
      alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false,
    });
    if (!context) return;
    const gl = context;
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return;
    }
    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
      return;
    }
    gl.attachShader(program, vertexShader); gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
      return;
    }
    const triangle = gl.createBuffer();
    const texture = gl.createTexture();
    if (!triangle || !texture) {
      gl.deleteBuffer(triangle); gl.deleteTexture(texture);
      gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = {
      resolution: gl.getUniformLocation(program, "resolution"),
      pointer: gl.getUniformLocation(program, "pointer"),
      hover: gl.getUniformLocation(program, "hover"),
      pixelRatio: gl.getUniformLocation(program, "pixelRatio"),
      wordmark: gl.getUniformLocation(program, "wordmark"),
      wordmarkAspect: gl.getUniformLocation(program, "wordmarkAspect"),
      inkColor: gl.getUniformLocation(program, "inkColor"),
      compact: gl.getUniformLocation(program, "compact"),
      wordmarkY: gl.getUniformLocation(program, "wordmarkY"),
      warmColor: gl.getUniformLocation(program, "warmColor"),
      middleColor: gl.getUniformLocation(program, "middleColor"),
      coolColor: gl.getUniformLocation(program, "coolColor"),
    };
    const inkColor = hexToRgb(foreground);
    const colors = accentColors.map(hexToRgb);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const controller = new AbortController();
    const signal = controller.signal;
    const pointer = { currentX: 0, currentY: 0, targetX: 0, targetY: 0, hover: 0, targetHover: 0 };
    let ratio = 1;
    let compact = 0;
    let ready = false;
    let fontReady = false;
    let disposed = false;
    let lastTime = 0;
    let bounds: DOMRect | null = null;
    let input: { x: number; y: number } | null = null;

    function draw(time: number) {
      if (!fontReady || gl.isContextLost()) return false;
      if (input) {
        bounds ??= parent.getBoundingClientRect();
        pointer.targetX = (input.x - bounds.left) * ratio;
        pointer.targetY = (bounds.height - input.y + bounds.top) * ratio;
        input = null;
      }
      const step = (lastTime ? Math.min(time - lastTime, 48) : 1000 / 60) / (1000 / 60);
      lastTime = time;
      const positionBlend = reduced.matches ? 1 : 1 - Math.pow(0.82, step);
      const hoverBlend = reduced.matches ? 1 : 1 - Math.pow(0.92, step);
      pointer.currentX += (pointer.targetX - pointer.currentX) * positionBlend;
      pointer.currentY += (pointer.targetY - pointer.currentY) * positionBlend;
      pointer.hover += (pointer.targetHover - pointer.hover) * hoverBlend;
      const settled = Math.abs(pointer.targetX - pointer.currentX) < 0.25 &&
        Math.abs(pointer.targetY - pointer.currentY) < 0.25 &&
        Math.abs(pointer.targetHover - pointer.hover) < 0.0015;
      if (settled) {
        pointer.currentX = pointer.targetX; pointer.currentY = pointer.targetY;
        pointer.hover = pointer.targetHover; lastTime = 0;
      }
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointer.currentX, pointer.currentY);
      gl.uniform1f(uniforms.hover, pointer.hover);
      gl.uniform1f(uniforms.pixelRatio, ratio);
      gl.uniform1i(uniforms.wordmark, 0);
      gl.uniform1f(uniforms.wordmarkAspect, 1912 / 758);
      gl.uniform3fv(uniforms.inkColor, inkColor);
      gl.uniform3fv(uniforms.warmColor, colors[0]);
      gl.uniform3fv(uniforms.middleColor, colors[1]);
      gl.uniform3fv(uniforms.coolColor, colors[2]);
      gl.uniform1f(uniforms.compact, compact);
      gl.uniform1f(uniforms.wordmarkY, embedded ? (compact ? 0.60 : 0.53) : 0.47);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!ready) { ready = true; onReady(true); }
      return !settled;
    }
    const loop = createVisibleRenderLoop({
      element: parent,
      occludedBy: parent.closest(".deadspace-route")?.querySelector<HTMLElement>(".menu-overlay"),
      draw,
    });
    function resize() {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (!width || !height) return;
      compact = Number(width < 768);
      const size = getSceneBufferSize({ width, height, maxPixelRatio: compact ? 1 : 1.25 });
      canvas.width = size.width; canvas.height = size.height;
      ratio = canvas.width / width;
      gl.viewport(0, 0, canvas.width, canvas.height);
      pointer.currentX = pointer.targetX = canvas.width / 2;
      pointer.currentY = pointer.targetY = canvas.height / 2;
      pointer.hover = pointer.targetHover = 0;
      bounds = null; input = null; lastTime = 0;
      loop.request();
    }
    function uploadWordmark() {
      if (disposed || gl.isContextLost()) return;
      const source = createWordmarkTexture(headline, fontFamily);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      fontReady = true;
      loop.request();
    }
    function leave() {
      input = null; pointer.targetHover = 0;
      loop.request();
    }
    function preferenceChanged() {
      if (reduced.matches || !fine.matches) {
        pointer.currentX = pointer.targetX = canvas.width / 2;
        pointer.currentY = pointer.targetY = canvas.height / 2;
        pointer.hover = pointer.targetHover = 0;
      }
      input = null;
      loop.request();
    }
    parent.addEventListener("pointermove", event => {
      if (compact || reduced.matches || !fine.matches || event.pointerType !== "mouse") return;
      input = { x: event.clientX, y: event.clientY };
      pointer.targetHover = 1;
      loop.request();
    }, { passive: true, signal });
    parent.addEventListener("pointerleave", leave, { signal });
    window.addEventListener("blur", leave, { signal });
    document.addEventListener("scroll", () => { bounds = null; }, { capture: true, passive: true, signal });
    reduced.addEventListener("change", preferenceChanged, { signal });
    fine.addEventListener("change", preferenceChanged, { signal });
    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault(); ready = false; onReady(false); loop.setEnabled(false);
    }, { signal });
    canvas.addEventListener("webglcontextrestored", () => setContextVersion(value => value + 1), { signal });
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    if (document.fonts.check(`800 620px ${fontFamily}`)) uploadWordmark();
    else void document.fonts.load(`800 620px ${fontFamily}`).then(uploadWordmark, uploadWordmark);
    return () => {
      disposed = true; onReady(false); controller.abort(); observer.disconnect(); loop.destroy();
      gl.deleteProgram(program); gl.deleteShader(vertexShader); gl.deleteShader(fragmentShader);
      gl.deleteBuffer(triangle); gl.deleteTexture(texture);
    };
  }, [foreground, headline, accentColors, fontFamily, embedded, onReady, contextVersion]);
  return <canvas ref={canvasRef} className="hih-halftone" aria-hidden="true" />;
}

function PointerTrail({ accentColors }: { accentColors: [string, string, string] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const candidateCanvas = canvasRef.current;
    const candidateParent = candidateCanvas?.parentElement;
    if (!candidateCanvas || !candidateParent) return;
    const canvas = candidateCanvas;
    const parent = candidateParent;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    const interactive = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const controller = new AbortController();
    const signal = controller.signal;
    const particles: TrailParticle[] = [];
    let width = 1;
    let height = 1;
    let ratioX = 1;
    let ratioY = 1;
    let bounds: DOMRect | null = null;
    let input: { x: number; y: number } | null = null;
    let pointerX = 0;
    let pointerY = 0;
    let previousX = 0;
    let previousY = 0;
    let pointerVisible = false;
    let entering = true;
    let lastTime = 0;
    const snap = (value: number) => Math.round(value / 3) * 3;
    function clear() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    function draw(time: number) {
      if (input) {
        bounds ??= parent.getBoundingClientRect();
        pointerX = input.x - bounds.left; pointerY = input.y - bounds.top;
        if (entering) { previousX = pointerX; previousY = pointerY; entering = false; }
        const dx = pointerX - previousX;
        const dy = pointerY - previousY;
        const count = 1 + Math.floor(Math.min(Math.hypot(dx, dy), 60) / 12);
        for (let index = 0; index < count && particles.length < 120; index++) {
          particles.push({
            x: pointerX + (Math.random() - 0.5) * 4, y: pointerY + (Math.random() - 0.5) * 4,
            velocityX: -dx * 0.04 + (Math.random() - 0.5) * 0.6,
            velocityY: -dy * 0.04 + (Math.random() - 0.5) * 0.6,
            life: 1, size: 3 + Math.random() * 3,
          });
        }
        previousX = pointerX; previousY = pointerY; input = null;
      }
      const step = (lastTime ? Math.min(time - lastTime, 48) : 1000 / 60) / (1000 / 60);
      lastTime = time;
      clear();
      ctx.setTransform(ratioX, 0, 0, ratioY, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      for (let index = particles.length - 1; index >= 0; index--) {
        const particle = particles[index];
        particle.x += particle.velocityX * step; particle.y += particle.velocityY * step;
        particle.velocityX *= Math.pow(0.92, step); particle.velocityY *= Math.pow(0.92, step);
        particle.life -= 0.03 * step;
        if (particle.life <= 0) { particles.splice(index, 1); continue; }
        const separation = (1 - particle.life) * 5 + 1.5;
        const size = particle.size * particle.life;
        const x = snap(particle.x); const y = snap(particle.y);
        ctx.globalAlpha = particle.life * 0.55;
        for (let channel = 0; channel < 3; channel++) {
          ctx.fillStyle = accentColors[channel];
          ctx.fillRect(x + (channel - 1) * separation, y, size, size);
        }
      }
      if (pointerVisible) {
        ctx.globalAlpha = 0.9;
        for (let channel = 0; channel < 3; channel++) {
          ctx.fillStyle = accentColors[channel];
          ctx.fillRect(snap(pointerX) + (channel - 1) * 2, snap(pointerY) - 3, 6, 6);
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (!particles.length) lastTime = 0;
      return particles.length > 0;
    }
    const loop = createVisibleRenderLoop({
      element: parent, draw, enabled: interactive.matches,
      occludedBy: parent.closest(".deadspace-route")?.querySelector<HTMLElement>(".menu-overlay"),
    });
    function resize() {
      width = parent.clientWidth; height = parent.clientHeight;
      if (!width || !height) return;
      const size = getSceneBufferSize({ width, height, maxPixelRatio: 1 });
      canvas.width = size.width; canvas.height = size.height;
      ratioX = canvas.width / width; ratioY = canvas.height / height;
      bounds = null; input = null; particles.length = 0; pointerVisible = false; entering = true; lastTime = 0;
      loop.request();
    }
    function leave() { pointerVisible = false; entering = true; input = null; loop.request(); }
    parent.addEventListener("pointermove", event => {
      if (!interactive.matches || event.pointerType !== "mouse") return;
      input = { x: event.clientX, y: event.clientY }; pointerVisible = true; loop.request();
    }, { signal, passive: true });
    parent.addEventListener("pointerleave", leave, { signal });
    window.addEventListener("blur", leave, { signal });
    document.addEventListener("scroll", () => { bounds = null; }, { capture: true, passive: true, signal });
    interactive.addEventListener("change", () => {
      resize();
      if (!interactive.matches) clear();
      loop.setEnabled(interactive.matches);
    }, { signal });
    const observer = new ResizeObserver(resize);
    observer.observe(parent);
    resize();
    return () => { controller.abort(); observer.disconnect(); loop.destroy(); };
  }, [accentColors]);
  return <canvas ref={canvasRef} className="hih-trail" aria-hidden="true" />;
}

function formatTime(timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(new Date())
      .toLowerCase();
  } catch {
    return "time unavailable";
  }
}

export default function HalftoneInterfaceHero({
  headline = DEFAULT_HEADLINE,
  navigation = DEFAULT_NAVIGATION,
  utilityLinks = DEFAULT_UTILITY_LINKS,
  brand = DEFAULT_BRAND,
  footerLabel = "© 2026 BLANK interfaces",
  locationLabel = "nyc",
  timeZone = "America/New_York",
  background = "#121212",
  foreground = "#f3f3f1",
  accentColors = DEFAULT_ACCENTS,
  className = "",
  embedded = false,
  fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif',
  onReady,
}: HalftoneInterfaceHeroProps) {
  const [clock, setClock] = useState(() => embedded ? "" : formatTime(timeZone));
  const [ready, setReady] = useState(false);
  const notifyReady = useCallback((next: boolean) => {
    setReady(next);
    onReady?.(next);
  }, [onReady]);

  useEffect(() => {
    if (embedded) return;
    setClock(formatTime(timeZone));
    const timer = window.setInterval(
      () => setClock(formatTime(timeZone)),
      30_000,
    );
    return () => window.clearInterval(timer);
  }, [timeZone, embedded]);

  return (
    <section
      className={`hih-root ${embedded ? "hih-embedded" : ""} ${className}`}
      data-ready={ready}
      aria-hidden={embedded || undefined}
      style={{ background, color: foreground }}
    >
      <style>{styles}</style>

      <div className="hih-field">
        <HalftoneCanvas headline={headline} foreground={foreground} accentColors={accentColors} fontFamily={fontFamily} embedded={embedded} onReady={notifyReady} />
        <PointerTrail accentColors={accentColors} />
      </div>

      {!embedded && <div className="hih-fallback" aria-hidden="true"><span>{headline[0]}</span><span>{headline[1]}</span></div>}
      {!embedded && <>
      <header className="hih-header">
        <a className="hih-brand" href="#top" aria-label={brand.join(" ")}>
          <span>{brand[0]}</span>
          <span>{brand[1]}</span>
        </a>

        <nav className="hih-navigation" aria-label="Primary navigation">
          {navigation.map((link) => (
            <a href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </nav>

        <nav className="hih-utilities" aria-label="Utility navigation">
          {utilityLinks.map((link) => (
            <a href={link.href} key={`${link.label}-${link.href}`}>
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <h1 className="hih-visually-hidden">{headline.join(" ")}</h1>

      <footer className="hih-footer">
        <p>{footerLabel}</p>
        <p className="hih-clock">
          {locationLabel} {clock}
        </p>
      </footer>
      </>}
    </section>
  );
}

const styles = `
.hih-root {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 18px;
  line-height: 1;
  letter-spacing: -0.035em;
}

.hih-fallback {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; font-size: clamp(50px, 12vw, 180px);
  pointer-events: none; line-height: 0.85;
}
.hih-root[data-ready="true"] .hih-fallback { display: none; }
.hih-root.hih-embedded .hih-field { inset: 0; cursor: inherit; }
.hih-field {
  position: absolute;
  inset: 0 0 5rem;
  overflow: hidden;
  cursor: none;
}

.hih-halftone,
.hih-trail {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.hih-halftone {
  z-index: 1;
  touch-action: pan-y;
}

.hih-trail {
  z-index: 10;
  pointer-events: none;
}

.hih-header,
.hih-footer {
  position: absolute;
  inset-inline: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: 2rem;
}

.hih-header {
  top: 0;
  min-height: 5.25rem;
  padding-block: 1.5rem;
}

.hih-header a {
  color: inherit;
  text-decoration: none;
  transition: opacity 180ms ease;
}

.hih-header a:hover,
.hih-header a:focus-visible {
  opacity: 0.58;
}

.hih-header a:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 5px;
}

.hih-brand {
  display: flex;
  flex-direction: column;
  width: 6.2rem;
  font-size: 1.45rem;
  line-height: 0.78;
  letter-spacing: -0.075em;
  text-transform: lowercase;
  transform: scaleX(0.92);
  transform-origin: left center;
}

.hih-brand span:first-child::before {
  content: "✣";
  display: inline-block;
  margin-right: 0.1em;
  font-size: 0.62em;
  transform: translateY(-0.18em);
}

.hih-navigation {
  position: absolute;
  left: 50%;
  display: flex;
  gap: 2rem;
  line-height: 1.55;
  transform: translateX(-50%);
}

.hih-utilities {
  display: flex;
  gap: 1.25rem;
  margin-left: auto;
  line-height: 1.55;
}

.hih-footer {
  bottom: 0;
  align-items: flex-end;
  padding-block: 1.25rem;
  line-height: 1.55;
}

.hih-footer p {
  margin: 0;
}

.hih-clock {
  font-variant-numeric: tabular-nums;
}

.hih-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .hih-root {
    font-size: 15px;
  }

  .hih-field {
    bottom: 4rem;
    cursor: auto;
  }

  .hih-header,
  .hih-footer {
    padding-inline: 1rem;
  }

  .hih-header {
    min-height: 4.5rem;
    padding-block: 1rem;
  }

  .hih-brand {
    width: 4.9rem;
    font-size: 1.15rem;
  }

  .hih-navigation {
    display: none;
  }

  .hih-utilities {
    gap: 1rem;
  }

  .hih-utilities a:first-child {
    display: none;
  }

  .hih-footer {
    padding-block: 1rem;
  }

  .hih-trail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hih-header a {
    transition: none;
  }

  .hih-trail {
    display: none;
  }
}
`;
