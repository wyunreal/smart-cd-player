import {
  MAX_DISC_RADIUS_RATIO,
  MIN_DISC_RADIUS_RATIO,
} from "./constants";

export type GrayscaleImage = {
  data: Uint8Array | Uint8ClampedArray | Buffer;
  width: number;
  height: number;
};

export type DiscDetection = {
  /** Centre X in the coordinate space of the given image. */
  cx: number;
  /** Centre Y in the coordinate space of the given image. */
  cy: number;
  /** Detected outer radius, in pixels. */
  r: number;
  /**
   * Share of the circumference (0..1) that is backed by a strong edge.
   * A value below the processing threshold means the circle is not reliable.
   */
  confidence: number;
};

type CircleCandidate = DiscDetection & { score: number };

const MAX_EDGES = 30_000;
const RADIUS_STEPS = 48;
const ANGLE_SAMPLES = 360;
const RADIAL_BAND = 2;
const MIN_VISIBILITY = 0.5;

const MIN_EDGE_MAGNITUDE = 24;

/** Sobel gradients plus unit normals, at the original image resolution. */
const computeGradients = (image: GrayscaleImage) => {
  const { data, width, height } = image;
  const pixelCount = width * height;
  const magnitude = new Float32Array(pixelCount);
  const normalX = new Float32Array(pixelCount);
  const normalY = new Float32Array(pixelCount);

  let maxMagnitude = 0;

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const index = row + x;

      const topLeft = data[index - width - 1];
      const top = data[index - width];
      const topRight = data[index - width + 1];
      const left = data[index - 1];
      const right = data[index + 1];
      const bottomLeft = data[index + width - 1];
      const bottom = data[index + width];
      const bottomRight = data[index + width + 1];

      const gx =
        topRight + 2 * right + bottomRight - (topLeft + 2 * left + bottomLeft);
      const gy =
        bottomLeft + 2 * bottom + bottomRight - (topLeft + 2 * top + topRight);

      const value = Math.hypot(gx, gy);
      magnitude[index] = value;

      if (value > maxMagnitude) maxMagnitude = value;
      if (value > 1e-6) {
        normalX[index] = gx / value;
        normalY[index] = gy / value;
      }
    }
  }

  return { magnitude, normalX, normalY, maxMagnitude };
};

/**
 * Picks a magnitude threshold that keeps the strongest edges, capped at
 * MAX_EDGES so noisy photos cannot make the Hough vote unbounded.
 */
const computeEdgeThreshold = (
  magnitude: Float32Array,
  maxMagnitude: number,
): number => {
  if (maxMagnitude < MIN_EDGE_MAGNITUDE) return Number.POSITIVE_INFINITY;

  const bins = 1024;
  const histogram = new Uint32Array(bins);

  for (let i = 0; i < magnitude.length; i++) {
    const value = magnitude[i];
    if (value <= 0) continue;
    const bin = Math.min(bins - 1, Math.floor((value / maxMagnitude) * bins));
    histogram[bin]++;
  }

  let accumulated = 0;
  let bin = bins - 1;
  for (; bin > 0; bin--) {
    accumulated += histogram[bin];
    if (accumulated > MAX_EDGES) break;
  }

  const adaptive = (bin / bins) * maxMagnitude;
  return Math.max(maxMagnitude * 0.08, adaptive);
};

type Edge = {
  x: number;
  y: number;
  nx: number;
  ny: number;
};

const collectEdges = (
  image: GrayscaleImage,
  magnitude: Float32Array,
  normalX: Float32Array,
  normalY: Float32Array,
  threshold: number,
): Edge[] => {
  const { width, height } = image;
  const edges: Edge[] = [];

  for (let y = 1; y < height - 1; y++) {
    const row = y * width;
    for (let x = 1; x < width - 1; x++) {
      const index = row + x;
      if (magnitude[index] < threshold) continue;

      edges.push({
        x,
        y,
        nx: normalX[index],
        ny: normalY[index],
      });

      if (edges.length >= MAX_EDGES) return edges;
    }
  }

  return edges;
};

const bilinear = (
  data: Float32Array,
  width: number,
  height: number,
  x: number,
  y: number,
): number => {
  if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return 0;

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;

  const top = data[y0 * width + x0] * (1 - fx) + data[y0 * width + x1] * fx;
  const bottom =
    data[y1 * width + x0] * (1 - fx) + data[y1 * width + x1] * fx;

  return top * (1 - fy) + bottom * fy;
};

type CircleScore = {
  support: number;
  mean: number;
  visibility: number;
};

/**
 * Samples the circumference and measures how much of it sits on a strong
 * gradient. The radial band absorbs small radius errors from the Hough vote.
 */
const scoreCircle = (
  magnitude: Float32Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number,
  strongThreshold: number,
  maxMagnitude: number,
): CircleScore => {
  let strongSamples = 0;
  let visibleSamples = 0;
  let total = 0;

  for (let i = 0; i < ANGLE_SAMPLES; i++) {
    const angle = (i / ANGLE_SAMPLES) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let best = 0;
    let visible = false;

    for (let dr = -RADIAL_BAND; dr <= RADIAL_BAND; dr++) {
      const x = cx + (r + dr) * cos;
      const y = cy + (r + dr) * sin;

      if (x >= 0 && x <= width - 1 && y >= 0 && y <= height - 1) {
        visible = true;
      }

      const value = bilinear(magnitude, width, height, x, y);
      if (value > best) best = value;
    }

    if (visible) visibleSamples++;
    total += best;
    if (best >= strongThreshold) strongSamples++;
  }

  return {
    support: strongSamples / ANGLE_SAMPLES,
    mean: maxMagnitude > 0 ? total / ANGLE_SAMPLES / maxMagnitude : 0,
    visibility: visibleSamples / ANGLE_SAMPLES,
  };
};

const evaluateCircle = (
  magnitude: Float32Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  r: number,
  strongThreshold: number,
  maxMagnitude: number,
): CircleCandidate | null => {
  const score = scoreCircle(
    magnitude,
    width,
    height,
    cx,
    cy,
    r,
    strongThreshold,
    maxMagnitude,
  );

  if (score.visibility < MIN_VISIBILITY) return null;

  return {
    cx,
    cy,
    r,
    confidence: score.support * score.visibility,
    score: (score.support + score.mean * 0.1) * score.visibility,
  };
};

/**
 * Gradient-direction Hough transform for the outer CD circle.
 *
 * The raw image is expected to be grayscale (one channel). The result is in
 * the same coordinate space as the input image, so the caller can map it back
 * to the full-resolution source.
 */
export const detectDisc = (image: GrayscaleImage): DiscDetection => {
  const { width, height } = image;
  const shortEdge = Math.min(width, height);

  const fallback: DiscDetection = {
    cx: width / 2,
    cy: height / 2,
    r: shortEdge / 2,
    confidence: 0,
  };

  if (shortEdge < 32) return fallback;

  const { magnitude, normalX, normalY, maxMagnitude } =
    computeGradients(image);

  if (maxMagnitude < MIN_EDGE_MAGNITUDE) return fallback;

  const edgeThreshold = computeEdgeThreshold(magnitude, maxMagnitude);
  const edges = collectEdges(
    image,
    magnitude,
    normalX,
    normalY,
    edgeThreshold,
  );

  if (edges.length < 32) return fallback;

  const minRadius = Math.max(
    8,
    Math.round(shortEdge * MIN_DISC_RADIUS_RATIO),
  );
  const maxRadius = Math.min(
    Math.round(shortEdge * MAX_DISC_RADIUS_RATIO),
    Math.floor(shortEdge / 2),
  );

  if (maxRadius <= minRadius) return fallback;

  const radiusStep = Math.max(1, (maxRadius - minRadius) / RADIUS_STEPS);
  const strongThreshold = Math.max(maxMagnitude * 0.12, 8);

  const accumulator = new Uint32Array(width * height);
  const candidates: CircleCandidate[] = [];

  for (let r = minRadius; r <= maxRadius; r += radiusStep) {
    accumulator.fill(0);

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];

      const cx1 = Math.round(edge.x - r * edge.nx);
      const cy1 = Math.round(edge.y - r * edge.ny);
      if (cx1 >= 0 && cx1 < width && cy1 >= 0 && cy1 < height) {
        accumulator[cy1 * width + cx1]++;
      }

      const cx2 = Math.round(edge.x + r * edge.nx);
      const cy2 = Math.round(edge.y + r * edge.ny);
      if (cx2 >= 0 && cx2 < width && cy2 >= 0 && cy2 < height) {
        accumulator[cy2 * width + cx2]++;
      }
    }

    // Evaluate the best accumulator cell and its direct neighbours: the
    // true centre can fall between two integer cells.
    let bestIndex = 0;
    let bestVotes = 0;
    for (let index = 0; index < accumulator.length; index++) {
      if (accumulator[index] > bestVotes) {
        bestVotes = accumulator[index];
        bestIndex = index;
      }
    }

    if (bestVotes === 0) continue;

    const bestX = bestIndex % width;
    const bestY = Math.floor(bestIndex / width);

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = bestX + dx;
        const cy = bestY + dy;
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;

        const candidate = evaluateCircle(
          magnitude,
          width,
          height,
          cx,
          cy,
          r,
          strongThreshold,
          maxMagnitude,
        );
        if (candidate) candidates.push(candidate);
      }
    }
  }

  if (candidates.length === 0) return fallback;

  candidates.sort((a, b) => b.score - a.score);
  let best = candidates[0];

  // Prefer the outer circle when an inner ring scores almost as well.
  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate.score < best.score - 0.02) break;
    if (candidate.r > best.r * 1.05) best = candidate;
  }

  // Local refinement around the coarse Hough result.
  const centreStep = Math.max(1, best.r * 0.01);
  const radiusStepRefine = Math.max(1, best.r * 0.01);
  let refined = best;

  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dr = -2; dr <= 2; dr++) {
        const r = best.r + dr * radiusStepRefine;
        if (r < minRadius * 0.9 || r > maxRadius * 1.1) continue;

        const candidate = evaluateCircle(
          magnitude,
          width,
          height,
          best.cx + dx * centreStep,
          best.cy + dy * centreStep,
          r,
          strongThreshold,
          maxMagnitude,
        );

        if (candidate && candidate.score > refined.score) refined = candidate;
      }
    }
  }

  return {
    cx: refined.cx,
    cy: refined.cy,
    r: refined.r,
    confidence: Math.max(0, Math.min(1, refined.confidence)),
  };
};
