import type { SpectrumVisualization } from "./types";

const FREQ_MIN = 20;
const FREQ_MAX = 20000;
const LED_HEIGHT = 4;
const LED_GAP = 2;
const LED_STEP = LED_HEIGHT + LED_GAP;

const perceptualGain = (f: number): number => {
  if (f <= 150) return 1.0;
  return Math.pow(f / 150, 0.18);
};

const ledBars: SpectrumVisualization = ({
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
  const totalBars = barCount * 2;
  const barWidth = drawWidth / totalBars;
  const totalSegments = Math.floor(height / LED_STEP);

  const nyquist = sampleRate / 2;
  const logMin = Math.log10(FREQ_MIN);
  const logMax = Math.log10(FREQ_MAX);

  for (let i = 0; i < barCount; i++) {
    const logFreqLow = logMin + (i / barCount) * (logMax - logMin);
    const logFreqHigh = logMin + ((i + 1) / barCount) * (logMax - logMin);
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

    // Left channel
    let sumL = 0;
    for (let j = binLow; j < binHigh && j < leftData.length; j++) {
      sumL += leftData[j];
    }
    const valueL = Math.min(255, (sumL / count) * gain);
    const litSegmentsL = Math.round((valueL / 255) * totalSegments);
    const opacityL = 0.15 + (valueL / 255) * 0.85;

    // Right channel
    let sumR = 0;
    for (let j = binLow; j < binHigh && j < rightData.length; j++) {
      sumR += rightData[j];
    }
    const valueR = Math.min(255, (sumR / count) * gain);
    const litSegmentsR = Math.round((valueR / 255) * totalSegments);
    const opacityR = 0.15 + (valueR / 255) * 0.85;

    // Left half: left channel, frequencies inverted (high at edge, low at center)
    const xL = paddingX + (barCount - 1 - i) * barWidth;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityL})`;
    for (let s = 0; s < litSegmentsL; s++) {
      const y = height - (s + 1) * LED_STEP + LED_GAP;
      ctx.fillRect(xL, y, barWidth - 1, LED_HEIGHT);
    }

    // Right half: right channel (low at center, high at edge)
    const xR = paddingX + (barCount + i) * barWidth;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacityR})`;
    for (let s = 0; s < litSegmentsR; s++) {
      const y = height - (s + 1) * LED_STEP + LED_GAP;
      ctx.fillRect(xR, y, barWidth - 1, LED_HEIGHT);
    }
  }
};

export default ledBars;
