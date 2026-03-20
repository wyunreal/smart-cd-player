export type SpectrumVisualizationContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  leftData: Uint8Array;
  rightData: Uint8Array;
  leftTimeDomain: Uint8Array;
  rightTimeDomain: Uint8Array;
  sampleRate: number;
  barCount: number;
  color: { r: number; g: number; b: number };
  hasAudioSignal: boolean;
};

export type SpectrumVisualization = (context: SpectrumVisualizationContext) => void;
