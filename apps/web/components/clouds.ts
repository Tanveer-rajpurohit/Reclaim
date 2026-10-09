// Seeded PRNG so clouds are reproducible between renders (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// One noise "octave": a low-res random grid, smoothly interpolated at
// full resolution. Several octaves at different grid sizes, summed
// together with decreasing weight, is fBm (fractal Brownian motion) —
// the standard technique behind procedural clouds/terrain.
function makeOctave(gridW: number, gridH: number, rand: () => number) {
  const grid = new Float32Array(gridW * gridH);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  return (u: number, v: number) => {
    const gx = u * (gridW - 1);
    const gy = v * (gridH - 1);
    const x0 = Math.floor(gx),
      y0 = Math.floor(gy);
    const x1 = Math.min(x0 + 1, gridW - 1);
    const y1 = Math.min(y0 + 1, gridH - 1);
    const fx = gx - x0,
      fy = gy - y0;
    const smooth = (t: number) => t * t * (3 - 2 * t);
    const sx = smooth(fx),
      sy = smooth(fy);

    const a = grid[y0 * gridW + x0] ?? 0;
    const b = grid[y0 * gridW + x1] ?? 0;
    const c = grid[y1 * gridW + x0] ?? 0;
    const d = grid[y1 * gridW + x1] ?? 0;
    const top = a + (b - a) * sx;
    const bottom = c + (d - c) * sx;
    return top + (bottom - top) * sy;
  };
}

/**
 * A small tileable grain texture, built once. Draw it every frame with
 * globalCompositeOperation = "overlay" across the WHOLE canvas (sky +
 * clouds together) — that's what gives the uniform photographic grain
 * your Python reference had, instead of grain trapped inside the clouds.
 */
export function buildGrainTile(size = 128, seed = 3): HTMLCanvasElement {
  const rand = mulberry32(seed);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < size * size; i++) {
    const u1 = Math.max(rand(), 1e-6);
    const u2 = rand();
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const value = Math.min(255, Math.max(0, 128 + g * 22));

    const p = i * 4;
    data[p] = data[p + 1] = data[p + 2] = value;
    data[p + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export interface CloudTheme {
  cloudColor: [number, number, number];
  coveragePercentile: number; // e.g. 0.55 — this % of the sky stays clear
  softness: number; // 0.15-0.4 — gap between low/high threshold (bigger = softer edges)
  grainAmount: number;
  shadeFloor?: number;
}

export function buildCloudLayer(
  width: number,
  height: number,
  seed: number,
  theme: CloudTheme,
): HTMLCanvasElement {
  const rand = mulberry32(seed);

  const densityOctaves = [
    { grid: 4, gain: 1.0 },
    { grid: 8, gain: 0.55 },
    { grid: 16, gain: 0.3 },
    { grid: 32, gain: 0.16 },
    { grid: 64, gain: 0.08 },
  ].map((o) => ({
    sample: makeOctave(o.grid, Math.max(2, o.grid >> 1), rand),
    gain: o.gain,
  }));
  const densityGainSum = densityOctaves.reduce((s, o) => s + o.gain, 0);

  const shadeOctaves = [
    { grid: 6, gain: 1.0 },
    { grid: 12, gain: 0.5 },
    { grid: 24, gain: 0.25 },
  ].map((o) => ({
    sample: makeOctave(o.grid, Math.max(2, o.grid >> 1), rand),
    gain: o.gain,
  }));
  const shadeGainSum = shadeOctaves.reduce((s, o) => s + o.gain, 0);

  // --- PASS 1: raw noise + density-biased field everywhere ---
  const nBuffer = new Float32Array(width * height);
  const shadeBuffer = new Float32Array(width * height);
  const densityBuffer = new Float32Array(width * height);
  let nMin = Infinity,
    nMax = -Infinity;
  let shadeMin = Infinity,
    shadeMax = -Infinity;

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      let n = 0;
      for (const o of densityOctaves) n += o.sample(u, v) * o.gain;
      n /= densityGainSum;

      let shade = 0;
      for (const o of shadeOctaves) shade += o.sample(u, v) * o.gain;
      shade /= shadeGainSum;

      const idx = y * width + x;
      nBuffer[idx] = n;
      shadeBuffer[idx] = shade;
      if (n < nMin) nMin = n;
      if (n > nMax) nMax = n;
      if (shade < shadeMin) shadeMin = shade;
      if (shade > shadeMax) shadeMax = shade;
    }
  }

  const nRange = Math.max(1e-6, nMax - nMin);
  const shadeRange = Math.max(1e-6, shadeMax - shadeMin);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1);
    const densityBias = 0.15 + 0.85 * Math.pow(v, 1.4);
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const n = ((nBuffer[idx] ?? 0) - nMin) / nRange;
      densityBuffer[idx] = n * densityBias;
    }
  }

  // --- Find thresholds as PERCENTILES of the actual density distribution,
  // not fixed constants — this is what makes coverage % resolution-independent.
  const sample: number[] = [];
  for (let i = 0; i < densityBuffer.length; i += 7)
    sample.push(densityBuffer[i] ?? 0);
  sample.sort((a, b) => a - b);
  const percentile = (p: number) =>
    sample[Math.min(sample.length - 1, Math.floor(p * (sample.length - 1)))] ??
    0;

  const coverageLow = percentile(theme.coveragePercentile);
  const coverageHigh = percentile(
    Math.min(0.99, theme.coveragePercentile + theme.softness),
  );

  // --- PASS 2: threshold + shade + grain -> pixels ---
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx)
    throw new Error("A 2D canvas context is required for cloud rendering.");
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const [cr, cg, cb] = theme.cloudColor;

  for (let i = 0; i < densityBuffer.length; i++) {
    const shade = ((shadeBuffer[i] ?? 0) - shadeMin) / shadeRange;
    const coverage = smoothstep(
      coverageLow,
      coverageHigh,
      densityBuffer[i] ?? 0,
    );
    const floor = theme.shadeFloor ?? 0.6;
    const shadeFactor = floor + (1 - floor) * shade;
    const grain = (Math.random() - 0.5) * theme.grainAmount * 2;

    const p = i * 4;
    data[p] = cr * shadeFactor + grain;
    data[p + 1] = cg * shadeFactor + grain;
    data[p + 2] = cb * shadeFactor + grain;
    // Feather the procedural tile so the composited cloud layers have no visible rectangular edge.
    const u = (i % width) / (width - 1);
    const v = Math.floor(i / width) / (height - 1);
    const edge =
      smoothstep(0, 0.12, u) *
      smoothstep(0, 0.12, 1 - u) *
      smoothstep(0, 0.12, v) *
      smoothstep(0, 0.16, 1 - v);
    data[p + 3] = Math.round(coverage * edge * 255);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export const CLOUD_THEMES: Record<string, CloudTheme> = {
  day: {
    cloudColor: [255, 255, 255],
    coveragePercentile: 0.61,
    softness: 0.3,
    grainAmount: 4,
  },
  sunset: {
    cloudColor: [255, 214, 190],
    coveragePercentile: 0.61,
    softness: 0.3,
    grainAmount: 5,
  },
  twilight: {
    cloudColor: [220, 190, 220],
    coveragePercentile: 0.61,
    softness: 0.3,
    grainAmount: 6,
  },
  synthwave: {
    cloudColor: [255, 150, 220],
    coveragePercentile: 0.61,
    softness: 0.28,
    grainAmount: 6,
  },
  mars: {
    cloudColor: [214, 140, 110],
    coveragePercentile: 0.61,
    softness: 0.28,
    grainAmount: 8,
  },
  stealth: {
    cloudColor: [140, 170, 190],
    coveragePercentile: 0.61,
    softness: 0.25,
    grainAmount: 6,
  },
};
