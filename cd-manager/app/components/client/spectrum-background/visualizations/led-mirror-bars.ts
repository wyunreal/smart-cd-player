import type { SpectrumVisualization } from "./types";

const FREQ_MIN = 20;
const FREQ_MAX = 20000;
const CENTER_GAP = 2;
const AMPLITUDE = 0.7;
const LED_HEIGHT = 4;
const LED_GAP = 2;
const LED_STEP = LED_HEIGHT + LED_GAP;

const perceptualGain = (f: number): number => {
  if (f <= 150) return 1.0;
  return Math.pow(f / 150, 0.18);
};

const ledMirrorBars: SpectrumVisualization = ({
  ctx,
  width,
  height,
  leftData,
  rightData,
  sampleRate,
  barCount,
  color: { r, g, b },
  paddingX,
}) => {
  const drawWidth = width - paddingX * 2;
  const mirrorBarCount = barCount * 2;
  const barWidth = drawWidth / mirrorBarCount;
  const centerY = height / 2;
  const halfHeight = centerY - CENTER_GAP / 2;
  const totalSegments = Math.floor(halfHeight / LED_STEP);

  const nyquist = sampleRate / 2;
  const logMin = Math.log10(FREQ_MIN);
  const logMax = Math.log10(FREQ_MAX);

  for (let i = 0; i < mirrorBarCount; i++) {
    const logFreqLow = logMin + (i / mirrorBarCount) * (logMax - logMin);
    const logFreqHigh = logMin + ((i + 1) / mirrorBarCount) * (logMax - logMin);
    const binLow = Math.max(
      1,
      Math.floor((Math.pow(10, logFreqLow) / nyquist) * leftData.length),
    );
    const binHigh = Math.max(
      binLow + 1,
      Math.ceil((Math.pow(10, logFreqHigh) / nyquist) * leftData.length),
    );

    const centerFreq = Math.pow(10, (logFreqLow + logFreqHigh) / 2);
    const gain = perceptualGain(centerFreq);
    const count = Math.max(1, binHigh - binLow);
    const xPos = paddingX + i * barWidth;

    // Left channel — grows upward from center
    let sumL = 0;
    for (let j = binLow; j < binHigh && j < leftData.length; j++) {
      sumL += leftData[j];
    }
    const valueL = Math.min(255, (sumL / count) * gain);
    const litSegmentsL = Math.round((valueL / 255) * totalSegments * AMPLITUDE);
    const opacityL = 0.15 + (valueL / 255) * 0.85;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityL})`;
    for (let s = 0; s < litSegmentsL; s++) {
      const y = centerY - CENTER_GAP / 2 - (s + 1) * LED_STEP + LED_GAP;
      ctx.fillRect(xPos, y, barWidth - 1, LED_HEIGHT);
    }

    // Right channel — grows downward from center
    let sumR = 0;
    for (let j = binLow; j < binHigh && j < rightData.length; j++) {
      sumR += rightData[j];
    }
    const valueR = Math.min(255, (sumR / count) * gain);
    const litSegmentsR = Math.round((valueR / 255) * totalSegments * AMPLITUDE);
    const opacityR = 0.15 + (valueR / 255) * 0.85;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityR})`;
    for (let s = 0; s < litSegmentsR; s++) {
      const y = centerY + CENTER_GAP / 2 + s * LED_STEP;
      ctx.fillRect(xPos, y, barWidth - 1, LED_HEIGHT);
    }
  }
};

export default ledMirrorBars;
