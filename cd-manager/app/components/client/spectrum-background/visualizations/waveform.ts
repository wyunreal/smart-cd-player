import type { SpectrumVisualization } from "./types";

const EDGE_FADE_RATIO = 0.15;
const LINE_LAYERS = 5;
const LAYER_SPREAD = 2.5;
const GLOW_PASSES = 3;

const drawWave = (
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  centerY: number,
  amplitude: number,
  edgeGradient: CanvasGradient,
  baseLineWidth: number,
) => {
  // Draw glow passes (wider, more transparent) behind the main lines
  for (let g = GLOW_PASSES; g >= 1; g--) {
    ctx.beginPath();
    ctx.strokeStyle = edgeGradient;
    ctx.lineWidth = baseLineWidth + g * 4;
    ctx.globalAlpha = 0.04;

    const step = data.length / width;
    for (let x = 0; x < width; x++) {
      const idx = Math.floor(x * step);
      const v = (data[idx] - 128) / 128;
      const y = centerY + v * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Draw multiple layered lines with slight vertical offsets
  for (let layer = 0; layer < LINE_LAYERS; layer++) {
    const offset = (layer - (LINE_LAYERS - 1) / 2) * LAYER_SPREAD;
    const layerOpacity = 1 - Math.abs(layer - (LINE_LAYERS - 1) / 2) / ((LINE_LAYERS - 1) / 2) * 0.65;

    ctx.beginPath();
    ctx.strokeStyle = edgeGradient;
    ctx.lineWidth = baseLineWidth;
    ctx.globalAlpha = layerOpacity;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const step = data.length / width;
    for (let x = 0; x < width; x++) {
      const idx = Math.floor(x * step);
      const v = (data[idx] - 128) / 128;
      const y = centerY + v * amplitude + offset;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
};

const waveform: SpectrumVisualization = ({
  ctx,
  width,
  height,
  leftTimeDomain,
  rightTimeDomain,
  color: { r, g, b },
}) => {
  const edgeFade = width * EDGE_FADE_RATIO;
  const amplitude = height * 0.3;
  const leftCenterY = height * 0.35;
  const rightCenterY = height * 0.65;

  // Create horizontal gradient that fades at both edges
  const makeEdgeGradient = (opacity: number) => {
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    const solid = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    const transparent = `rgba(${r}, ${g}, ${b}, 0)`;
    grad.addColorStop(0, transparent);
    grad.addColorStop(edgeFade / width, solid);
    grad.addColorStop(1 - edgeFade / width, solid);
    grad.addColorStop(1, transparent);
    return grad;
  };

  const gradient = makeEdgeGradient(0.6);

  ctx.save();
  ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
  ctx.shadowBlur = 8;

  drawWave(ctx, leftTimeDomain, width, leftCenterY, amplitude, gradient, 1.2);
  drawWave(ctx, rightTimeDomain, width, rightCenterY, amplitude, gradient, 1.2);

  ctx.restore();
};

export default waveform;
